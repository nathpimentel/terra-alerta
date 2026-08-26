using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/events")]
public sealed class EventsController(IEventService eventService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyCollection<GeoEvent>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<IReadOnlyCollection<GeoEvent>>> GetEvents(
        [FromQuery] string? category,
        CancellationToken cancellationToken)
    {
        try
        {
            var events = await eventService.GetEventsAsync(cancellationToken);

            if (!string.IsNullOrWhiteSpace(category))
            {
                events = events
                    .Where(item => item.Category.Equals(category, StringComparison.OrdinalIgnoreCase))
                    .ToArray();
            }

            return Ok(events);
        }
        catch (HttpRequestException)
        {
            return Problem(
                title: "Fontes externas indisponíveis",
                detail: "Não foi possível atualizar os eventos neste momento.",
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }
    }
}
