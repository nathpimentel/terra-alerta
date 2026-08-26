using System.Text.Json.Serialization;

namespace backend.Dtos.External;

public sealed class UsgsResponse
{
    [JsonPropertyName("features")]
    public List<UsgsFeature> Features { get; init; } = [];
}

public sealed class UsgsFeature
{
    [JsonPropertyName("id")]
    public string Id { get; init; } = string.Empty;

    [JsonPropertyName("properties")]
    public UsgsProperties Properties { get; init; } = new();

    [JsonPropertyName("geometry")]
    public UsgsGeometry Geometry { get; init; } = new();
}

public sealed class UsgsProperties
{
    [JsonPropertyName("title")]
    public string Title { get; init; } = string.Empty;

    [JsonPropertyName("place")]
    public string Place { get; init; } = string.Empty;

    [JsonPropertyName("time")]
    public long Time { get; init; }

    [JsonPropertyName("mag")]
    public double Magnitude { get; init; }

    [JsonPropertyName("url")]
    public string Url { get; init; } = string.Empty;
}

public sealed class UsgsGeometry
{
    [JsonPropertyName("coordinates")]
    public double[] Coordinates { get; init; } = [];
}
