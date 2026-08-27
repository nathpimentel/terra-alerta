import { isOnEarth, type EventCategory, type GeoEvent } from "../types/events";

// Fontes públicas usadas quando a API ASP.NET Core não está disponível.
const EONET_BASE_URL = "https://eonet.gsfc.nasa.gov/api/v3/events";
const EONET_LIMIT_PER_CATEGORY = 30;
const USGS_URL =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson";

/* A EONET devolve os eventos abertos ordenados do mais recente para o mais
   antigo, e incêndios florestais são mais de 99% do volume. Numa consulta única
   os vulcões só apareceriam depois de algumas centenas de incêndios, o que
   deixava o filtro de vulcões sempre vazio: por isso pedimos uma página por
   categoria. O mapa também é a fonte da tradução para as categorias internas,
   para os dois não saírem de sincronia. */
const eonetCategories: Record<string, EventCategory> = {
  wildfires: "wildfire",
  severeStorms: "storm",
  volcanoes: "volcano",
};

type EonetGeometry = {
  date: string;
  type: string;
  coordinates: number[] | number[][];
};

type EonetEvent = {
  id: string;
  title: string;
  link: string;
  description?: string;
  categories: Array<{ id: string; title: string }>;
  geometry: EonetGeometry[];
};

type UsgsFeature = {
  id: string;
  geometry: { coordinates: [number, number, number?] };
  properties: {
    title: string;
    place: string;
    time: number;
    mag: number;
    url: string;
    alert?: string;
  };
};

function categoryFromEonet(id: string | undefined): EventCategory | null {
  return id ? eonetCategories[id] ?? null : null;
}

function extractCoordinates(geometry: EonetGeometry): [number, number] | null {
  if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2) return null;
  const coordinates = geometry.coordinates;
  if (typeof coordinates[0] === "number" && typeof coordinates[1] === "number") {
    return isOnEarth(coordinates[0], coordinates[1]) ? [coordinates[0], coordinates[1]] : null;
  }
  const nested = coordinates[0];
  if (Array.isArray(nested) && typeof nested[0] === "number" && typeof nested[1] === "number") {
    return isOnEarth(nested[0], nested[1]) ? [nested[0], nested[1]] : null;
  }
  return null;
}

async function loadEonetCategory(category: string): Promise<EonetEvent[]> {
  const url = `${EONET_BASE_URL}?status=open&category=${category}&limit=${EONET_LIMIT_PER_CATEGORY}`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`EONET respondeu ${response.status} em ${category}`);
  const payload = (await response.json()) as { events?: EonetEvent[] };
  return payload.events ?? [];
}

async function loadEonetEvents(): Promise<GeoEvent[]> {
  const responses = await Promise.allSettled(
    Object.keys(eonetCategories).map((category) => loadEonetCategory(category)),
  );

  // Uma categoria fora do ar não derruba as outras; só quando nenhuma responde
  // é que a EONET conta como indisponível para o chamador.
  if (responses.every((result) => result.status === "rejected")) {
    throw new Error("Nenhuma categoria da EONET respondeu.");
  }

  const seen = new Set<string>();

  return responses
    .filter((result): result is PromiseFulfilledResult<EonetEvent[]> => result.status === "fulfilled")
    .flatMap((result) => result.value)
    .flatMap((event) => {
      const category = categoryFromEonet(event.categories[0]?.id);
      const geometry = event.geometry.at(-1);
      const coordinates = geometry ? extractCoordinates(geometry) : null;
      if (!category || !geometry || !coordinates) return [];

      // Um evento com mais de uma categoria volta em mais de uma consulta.
      if (seen.has(event.id)) return [];
      seen.add(event.id);

      const [longitude, latitude] = coordinates;
      return [
        {
          id: `eonet-${event.id}`,
          title: event.title,
          category,
          latitude,
          longitude,
          occurredAt: geometry.date,
          location: event.title,
          severity: category === "wildfire" ? "high" : "moderate",
          source: "NASA EONET" as const,
          sourceUrl: event.link || "https://eonet.gsfc.nasa.gov/",
          description: event.description || "Evento natural ativo acompanhado pela NASA EONET.",
        },
      ];
    });
}

async function loadUsgsEvents(): Promise<GeoEvent[]> {
  const response = await fetch(USGS_URL, { headers: { Accept: "application/geo+json" } });
  if (!response.ok) throw new Error(`USGS respondeu ${response.status}`);
  const payload = (await response.json()) as { features?: UsgsFeature[] };

  return (payload.features ?? [])
    .filter((feature) => isOnEarth(feature.geometry.coordinates[0], feature.geometry.coordinates[1]))
    .map((feature) => ({
      id: `usgs-${feature.id}`,
      title: feature.properties.title,
      category: "earthquake" as const,
      latitude: feature.geometry.coordinates[1],
      longitude: feature.geometry.coordinates[0],
      occurredAt: new Date(feature.properties.time).toISOString(),
      location: feature.properties.place || "Localização não informada",
      severity:
        feature.properties.mag >= 6 ? "high" : feature.properties.mag >= 5 ? "moderate" : "low",
      magnitude: feature.properties.mag,
      source: "USGS" as const,
      sourceUrl: feature.properties.url,
      description: `Terremoto de magnitude ${feature.properties.mag.toFixed(1)} registrado pelo USGS.`,
    }));
}

/** Busca os eventos direto nas fontes públicas, sem passar pela API própria. */
export async function getEventsFromPublicSources(): Promise<GeoEvent[]> {
  const responses = await Promise.allSettled([loadEonetEvents(), loadUsgsEvents()]);

  return responses
    .filter((result): result is PromiseFulfilledResult<GeoEvent[]> => result.status === "fulfilled")
    .flatMap((result) => result.value)
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
}
