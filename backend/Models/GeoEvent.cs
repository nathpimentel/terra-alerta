namespace backend.Models;

public sealed class GeoEvent
{
    public required string Id { get; init; }
    public required string Title { get; init; }
    public required string Category { get; init; }
    public double Latitude { get; init; }
    public double Longitude { get; init; }
    public DateTimeOffset OccurredAt { get; init; }
    public required string Location { get; init; }
    public required string Severity { get; init; }
    public double? Magnitude { get; init; }
    public required string Source { get; init; }
    public required string SourceUrl { get; init; }
    public required string Description { get; init; }
}
