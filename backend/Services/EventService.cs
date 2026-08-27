using System.Text.Json;
using backend.Dtos.External;
using backend.Models;
using Microsoft.Extensions.Caching.Memory;

namespace backend.Services;

public sealed class EventService(
    HttpClient httpClient,
    IMemoryCache cache,
    IConfiguration configuration,
    ILogger<EventService> logger) : IEventService
{
    private const string CacheKey = "normalized-events";
    private const int DefaultEonetLimitPerCategory = 30;

    /* A EONET responde com os eventos abertos ordenados do mais recente para o
       mais antigo, e incendios florestais sao mais de 99% do volume. Numa
       consulta unica os vulcoes so apareceriam depois de algumas centenas de
       incendios, o que deixava o filtro de vulcoes sempre vazio: por isso
       pedimos uma pagina por categoria. O mapa tambem e a fonte da traducao
       para as categorias internas, para os dois nao saírem de sincronia. */
    private static readonly Dictionary<string, string> EonetCategories = new()
    {
        ["wildfires"] = "wildfire",
        ["severeStorms"] = "storm",
        ["volcanoes"] = "volcano"
    };

    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public async Task<IReadOnlyCollection<GeoEvent>> GetEventsAsync(CancellationToken cancellationToken)
    {
        if (cache.TryGetValue(CacheKey, out IReadOnlyCollection<GeoEvent>? cachedEvents) && cachedEvents is not null)
        {
            return cachedEvents;
        }

        var eonetTask = LoadEonetEventsAsync(cancellationToken);
        var usgsTask = LoadUsgsEventsAsync(cancellationToken);
        await Task.WhenAll(ObserveFailureAsync(eonetTask), ObserveFailureAsync(usgsTask));

        var events = new List<GeoEvent>();

        if (eonetTask.IsCompletedSuccessfully)
        {
            events.AddRange(eonetTask.Result);
        }

        if (usgsTask.IsCompletedSuccessfully)
        {
            events.AddRange(usgsTask.Result);
        }

        if (events.Count == 0)
        {
            throw new HttpRequestException("Nenhuma fonte externa respondeu com sucesso.");
        }

        var normalizedEvents = events
            .OrderByDescending(item => item.OccurredAt)
            .ToArray();

        cache.Set(CacheKey, normalizedEvents, TimeSpan.FromMinutes(5));
        return normalizedEvents;
    }

    private async Task<IReadOnlyCollection<GeoEvent>> LoadEonetEventsAsync(CancellationToken cancellationToken)
    {
        var baseUrl = configuration["ExternalApis:Eonet"]
            ?? throw new InvalidOperationException("A URL da NASA EONET não foi configurada.");

        var limit = configuration.GetValue<int?>("ExternalApis:EonetLimitPerCategory")
            ?? DefaultEonetLimitPerCategory;

        var requests = EonetCategories.Keys
            .Select(category => LoadEonetCategoryAsync(baseUrl, category, limit, cancellationToken))
            .ToArray();

        await Task.WhenAll(requests.Select(ObserveFailureAsync));

        // Uma categoria fora do ar nao derruba as outras; so quando nenhuma
        // responde e que a EONET conta como indisponivel para o chamador.
        if (requests.All(request => !request.IsCompletedSuccessfully))
        {
            throw new HttpRequestException("Nenhuma categoria da NASA EONET respondeu com sucesso.");
        }

        return requests
            .Where(request => request.IsCompletedSuccessfully)
            .SelectMany(request => request.Result)
            .Select(MapEonetEvent)
            .Where(item => item is not null)
            .Cast<GeoEvent>()
            // Um evento com mais de uma categoria volta em mais de uma consulta.
            .DistinctBy(item => item.Id)
            .ToArray();
    }

    private async Task<IReadOnlyCollection<EonetEvent>> LoadEonetCategoryAsync(
        string baseUrl,
        string category,
        int limit,
        CancellationToken cancellationToken)
    {
        var url = $"{baseUrl}?status=open&category={category}&limit={limit}";
        var response = await httpClient.GetFromJsonAsync<EonetResponse>(url, _jsonOptions, cancellationToken);
        return response?.Events ?? [];
    }

    private async Task<IReadOnlyCollection<GeoEvent>> LoadUsgsEventsAsync(CancellationToken cancellationToken)
    {
        var url = configuration["ExternalApis:Usgs"]
            ?? throw new InvalidOperationException("A URL do USGS não foi configurada.");

        var response = await httpClient.GetFromJsonAsync<UsgsResponse>(url, _jsonOptions, cancellationToken);
        if (response is null)
        {
            return [];
        }

        return response.Features
            .Where(feature => feature.Geometry.Coordinates.Length >= 2
                && IsOnEarth(feature.Geometry.Coordinates[0], feature.Geometry.Coordinates[1]))
            .Select(feature => new GeoEvent
            {
                Id = $"usgs-{feature.Id}",
                Title = feature.Properties.Title,
                Category = "earthquake",
                Longitude = feature.Geometry.Coordinates[0],
                Latitude = feature.Geometry.Coordinates[1],
                OccurredAt = DateTimeOffset.FromUnixTimeMilliseconds(feature.Properties.Time),
                Location = string.IsNullOrWhiteSpace(feature.Properties.Place)
                    ? "Localização não informada"
                    : feature.Properties.Place,
                Severity = feature.Properties.Magnitude >= 6
                    ? "high"
                    : feature.Properties.Magnitude >= 5 ? "moderate" : "low",
                Magnitude = feature.Properties.Magnitude,
                Source = "USGS",
                SourceUrl = feature.Properties.Url,
                Description = $"Terremoto de magnitude {feature.Properties.Magnitude:F1} registrado pelo USGS."
            })
            .ToArray();
    }

    private static GeoEvent? MapEonetEvent(EonetEvent source)
    {
        var sourceCategory = source.Categories.FirstOrDefault()?.Id;
        var category = sourceCategory is not null && EonetCategories.TryGetValue(sourceCategory, out var mapped)
            ? mapped
            : null;

        var geometry = source.Geometry.LastOrDefault();
        var coordinates = geometry is null ? null : ExtractCoordinates(geometry.Coordinates);
        if (category is null || geometry is null || coordinates is null)
        {
            return null;
        }

        return new GeoEvent
        {
            Id = $"eonet-{source.Id}",
            Title = source.Title,
            Category = category,
            Longitude = coordinates.Value.Longitude,
            Latitude = coordinates.Value.Latitude,
            OccurredAt = geometry.Date,
            Location = source.Title,
            Severity = category == "wildfire" ? "high" : "moderate",
            Source = "NASA EONET",
            SourceUrl = string.IsNullOrWhiteSpace(source.Link)
                ? "https://eonet.gsfc.nasa.gov/"
                : source.Link,
            Description = string.IsNullOrWhiteSpace(source.Description)
                ? "Evento natural ativo acompanhado pela NASA EONET."
                : source.Description
        };
    }

    /* A NASA EONET publica alguns registros com coordenadas fora do globo — havia
       um incêndio com latitude 200 e outro com longitude 189. Servi-los faz o
       MapLibre lançar no cliente, e uma única ocorrência derrubava a página. */
    private static bool IsOnEarth(double longitude, double latitude) =>
        double.IsFinite(longitude)
        && double.IsFinite(latitude)
        && longitude is >= -180 and <= 180
        && latitude is >= -90 and <= 90;

    private static (double Longitude, double Latitude)? ExtractCoordinates(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Array || element.GetArrayLength() < 2)
        {
            return null;
        }

        var first = element[0];
        var second = element[1];

        if (first.ValueKind == JsonValueKind.Number && second.ValueKind == JsonValueKind.Number)
        {
            var longitude = first.GetDouble();
            var latitude = second.GetDouble();
            return IsOnEarth(longitude, latitude) ? (longitude, latitude) : null;
        }

        if (first.ValueKind == JsonValueKind.Array)
        {
            return ExtractCoordinates(first);
        }

        return null;
    }

    private async Task ObserveFailureAsync(Task task)
    {
        try
        {
            await task;
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Uma fonte externa do TerraAlerta está indisponível.");
        }
    }
}
