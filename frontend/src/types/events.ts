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
