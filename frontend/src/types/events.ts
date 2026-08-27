export type EventCategory = "earthquake" | "wildfire" | "storm" | "volcano";

export interface GeoEvent {
  id: string;
  title: string;
  category: EventCategory;
  latitude: number;
  longitude: number;
  occurredAt: string;
  location: string;
  severity: "low" | "moderate" | "high";
  magnitude?: number;
  source: "NASA EONET" | "USGS";
  sourceUrl: string;
  description: string;
}

/**
 * A NASA EONET publica alguns registros com coordenadas fora do globo — havia
 * um incêndio com latitude 200 e outro com longitude 189. O MapLibre lança ao
 * receber esses valores, e um único evento assim derrubava a página inteira.
 */
export const isOnEarth = (longitude: number, latitude: number) =>
  Number.isFinite(longitude) &&
  Number.isFinite(latitude) &&
  Math.abs(longitude) <= 180 &&
  Math.abs(latitude) <= 90;
