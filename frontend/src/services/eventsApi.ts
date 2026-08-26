import api from "./api";
import { getEventsFromPublicSources } from "./externalSources";
import type { GeoEvent } from "../types/events";

/**
 * Busca os eventos na API ASP.NET Core. Se ela não estiver no ar,
 * recorre diretamente à NASA EONET e ao USGS.
 */
export async function getEvents(): Promise<GeoEvent[]> {
  try {
    const response = await api.get<GeoEvent[]>("/api/events");
    if (response.data.length) return response.data;
  } catch {
    // A API própria está indisponível: seguimos para as fontes públicas.
  }

  return getEventsFromPublicSources();
}
