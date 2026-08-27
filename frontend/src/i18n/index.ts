import type { Theme } from "../theme";
import type { EventCategory, GeoEvent } from "../types/events";

export type Language = "pt" | "en";

export const languages: { code: Language; label: string; name: string }[] = [
  { code: "pt", label: "PT", name: "Português" },
  { code: "en", label: "EN", name: "English" },
];

export interface Dictionary {
  htmlLang: string;
  locale: string;
  tagline: string;
  searchPlaceholder: string;
  live: string;
  refresh: string;
  language: string;
  theme: string;
  themeNames: Record<Theme, string>;
  activateTheme: (name: string) => string;
  overview: string;
  activeEvents: string;
  mostRecent: string;
  previewData: string;
  officialSources: string;
  disclaimer: string;
  coverage: string;
  coverageDetail: string;
  closeDetails: string;
  intensity: string;
  updated: string;
  source: string;
  openOfficialSource: string;
  mapLabel: string;
  viewEvent: (title: string) => string;
  hoursAgo: (hours: number) => string;
  daysAgo: (days: number) => string;
  categories: Record<EventCategory, string>;
  // Plural e singular sao declarados separadamente: derivar um do outro
  // cortando o "s" final erra em "Vulcoes" e em "Volcanoes".
  categoriesSingular: Record<EventCategory, string>;
  severity: Record<GeoEvent["severity"], string>;
}

export const dictionaries: Record<Language, Dictionary> = {
  pt: {
    htmlLang: "pt-BR",
    locale: "pt-BR",
    tagline: "Monitoramento ambiental",
    searchPlaceholder: "Buscar evento ou região",
    live: "Ao vivo",
    refresh: "Atualizar eventos",
    language: "Idioma",
    theme: "Tema",
    themeNames: { dark: "tema escuro", light: "tema claro" },
    activateTheme: (name) => `Ativar ${name}`,
    overview: "Visão geral",
    activeEvents: "Eventos ativos",
    mostRecent: "Mais recentes",
    previewData: "Dados de demonstração",
    officialSources: "Fontes oficiais",
    disclaimer: "Dados informativos. Em uma emergência, consulte as autoridades locais.",
    coverage: "Cobertura",
    coverageDetail: "Ativos agora · sismos de 7 dias",
    closeDetails: "Fechar detalhes",
    intensity: "Intensidade",
    updated: "Atualizado",
    source: "Fonte",
    openOfficialSource: "Abrir fonte oficial",
    mapLabel: "Mapa de eventos naturais",
    viewEvent: (title) => `Ver ${title}`,
    hoursAgo: (hours) => `há ${hours}h`,
    daysAgo: (days) => `há ${days}d`,
    categories: {
      earthquake: "Terremotos",
      wildfire: "Incêndios",
      storm: "Tempestades",
      volcano: "Vulcões",
    },
    categoriesSingular: {
      earthquake: "Terremoto",
      wildfire: "Incêndio",
      storm: "Tempestade",
      volcano: "Vulcão",
    },
    severity: { low: "Baixa", moderate: "Moderada", high: "Alta" },
  },
  en: {
    htmlLang: "en",
    locale: "en-US",
    tagline: "Environmental monitoring",
    searchPlaceholder: "Search for an event or region",
    live: "Live",
    refresh: "Refresh events",
    language: "Language",
    theme: "Theme",
    themeNames: { dark: "dark theme", light: "light theme" },
    activateTheme: (name) => `Switch to ${name}`,
    overview: "Overview",
    activeEvents: "Active events",
    mostRecent: "Most recent",
    previewData: "Demo data",
    officialSources: "Official sources",
    disclaimer: "Informational data. In an emergency, contact your local authorities.",
    coverage: "Coverage",
    coverageDetail: "Active now · quakes from 7 days",
    closeDetails: "Close details",
    intensity: "Intensity",
    updated: "Updated",
    source: "Source",
    openOfficialSource: "Open official source",
    mapLabel: "Map of natural events",
    viewEvent: (title) => `View ${title}`,
    hoursAgo: (hours) => `${hours}h ago`,
    daysAgo: (days) => `${days}d ago`,
    categories: {
      earthquake: "Earthquakes",
      wildfire: "Wildfires",
      storm: "Storms",
      volcano: "Volcanoes",
    },
    categoriesSingular: {
      earthquake: "Earthquake",
      wildfire: "Wildfire",
      storm: "Storm",
      volcano: "Volcano",
    },
    severity: { low: "Low", moderate: "Moderate", high: "High" },
  },
};

export const defaultLanguage: Language = "pt";

const STORAGE_KEY = "terra-alerta:language";

export const readStoredLanguage = (): Language => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "pt" || stored === "en" ? stored : defaultLanguage;
  } catch {
    return defaultLanguage;
  }
};

export const storeLanguage = (language: Language) => {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Navegacao privada ou storage bloqueado: a escolha vale so nesta sessao.
  }
};

export const relativeTime = (date: string, dictionary: Dictionary) => {
  const hours = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 3_600_000));
  return hours < 24 ? dictionary.hoursAgo(hours) : dictionary.daysAgo(Math.round(hours / 24));
};
