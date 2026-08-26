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
        var url = configuration["ExternalApis:Eonet"]
            ?? throw new InvalidOperationException("A URL da NASA EONET não foi configurada.");

        var response = await httpClient.GetFromJsonAsync<EonetResponse>(url, _jsonOptions, cancellationToken);
        if (response is null)
        {
            return [];
        }

        return response.Events
            .Select(MapEonetEvent)
            .Where(item => item is not null)
            .Cast<GeoEvent>()
            .ToArray();
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
            .Where(feature => feature.Geometry.Coordinates.Length >= 2)
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
        var category = source.Categories.FirstOrDefault()?.Id switch
        {
            "wildfires" => "wildfire",
            "severeStorms" => "storm",
            "volcanoes" => "volcano",
            _ => null
        };

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
            return (first.GetDouble(), second.GetDouble());
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
