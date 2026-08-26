using System.Text.Json;
using System.Text.Json.Serialization;

namespace backend.Dtos.External;

public sealed class EonetResponse
{
    [JsonPropertyName("events")]
    public List<EonetEvent> Events { get; init; } = [];
}

public sealed class EonetEvent
{
    [JsonPropertyName("id")]
    public string Id { get; init; } = string.Empty;

    [JsonPropertyName("title")]
    public string Title { get; init; } = string.Empty;

    [JsonPropertyName("link")]
    public string Link { get; init; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; init; }

    [JsonPropertyName("categories")]
    public List<EonetCategory> Categories { get; init; } = [];

    [JsonPropertyName("geometry")]
    public List<EonetGeometry> Geometry { get; init; } = [];
}

public sealed class EonetCategory
{
    [JsonPropertyName("id")]
    public string Id { get; init; } = string.Empty;
}

public sealed class EonetGeometry
{
    [JsonPropertyName("date")]
    public DateTimeOffset Date { get; init; }

    [JsonPropertyName("coordinates")]
    public JsonElement Coordinates { get; init; }
}
