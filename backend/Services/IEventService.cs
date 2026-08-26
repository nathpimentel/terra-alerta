using backend.Models;

namespace backend.Services;

public interface IEventService
{
    Task<IReadOnlyCollection<GeoEvent>> GetEventsAsync(CancellationToken cancellationToken);
}
