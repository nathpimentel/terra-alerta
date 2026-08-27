import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import { dictionaries, type Language } from "../i18n";
import { mapStyles, type Theme } from "../theme";
import { isOnEarth, type GeoEvent } from "../types/events";

const markerColors: Record<GeoEvent["category"], string> = {
  earthquake: "var(--quake)",
  wildfire: "var(--fire)",
  storm: "var(--storm)",
  volcano: "var(--volcano)",
};

interface AlertMapProps {
  events: GeoEvent[];
  selectedId?: string;
  language: Language;
  theme: Theme;
  onSelect: (event: GeoEvent) => void;
}

export default function AlertMap({ events, selectedId, language, theme, onSelect }: AlertMapProps) {
  const t = dictionaries[language];
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  // Guarda a folha de estilo em uso para trocar o basemap sem recriar o mapa
  // — recriar perderia o enquadramento atual a cada mudanca de tema.
  const styleRef = useRef(mapStyles[theme]);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleRef.current,
      center: [-37, 4],
      zoom: 1.75,
      minZoom: 1.2,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || styleRef.current === mapStyles[theme]) return;

    styleRef.current = mapStyles[theme];
    map.setStyle(styleRef.current);
  }, [theme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Ultima barreira contra coordenadas invalidas: o MapLibre lanca ao receber
    // uma latitude fora de -90..90 e a excecao subia ate desmontar a pagina.
    const markers = events.filter((event) => isOnEarth(event.longitude, event.latitude)).map((event) => {
      const element = document.createElement("button");
      element.className = "marker-shell";
      element.style.background = markerColors[event.category];
      element.dataset.active = String(event.id === selectedId);
      element.setAttribute("aria-label", t.viewEvent(event.title));
      element.addEventListener("click", () => onSelect(event));

      return new maplibregl.Marker({ element, anchor: "bottom" })
        .setLngLat([event.longitude, event.latitude])
        .addTo(map);
    });

    return () => markers.forEach((marker) => marker.remove());
  }, [events, onSelect, selectedId, t]);

  useEffect(() => {
    const selected = events.find((event) => event.id === selectedId);
    if (!selected || !mapRef.current || !isOnEarth(selected.longitude, selected.latitude)) return;
    mapRef.current.flyTo({
      center: [selected.longitude, selected.latitude],
      zoom: Math.max(mapRef.current.getZoom(), 4.2),
      duration: 900,
    });
  }, [events, selectedId]);

  return <div ref={containerRef} className="h-full w-full bg-map-void" aria-label={t.mapLabel} />;
}
