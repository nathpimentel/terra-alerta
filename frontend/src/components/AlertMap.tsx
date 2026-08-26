import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoEvent } from "../types/events";

const markerColors: Record<GeoEvent["category"], string> = {
  earthquake: "#f0a94b",
  wildfire: "#ef665d",
  storm: "#62a8ff",
  volcano: "#c47bff",
};

interface AlertMapProps {
  events: GeoEvent[];
  selectedId?: string;
  onSelect: (event: GeoEvent) => void;
}

export default function AlertMap({ events, selectedId, onSelect }: AlertMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
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
    if (!map) return;

    const markers = events.map((event) => {
      const element = document.createElement("button");
      element.className = "marker-shell";
      element.style.background = markerColors[event.category];
      element.dataset.active = String(event.id === selectedId);
      element.setAttribute("aria-label", `Ver ${event.title}`);
      element.addEventListener("click", () => onSelect(event));

      return new maplibregl.Marker({ element, anchor: "bottom" })
        .setLngLat([event.longitude, event.latitude])
        .addTo(map);
    });

    return () => markers.forEach((marker) => marker.remove());
  }, [events, onSelect, selectedId]);

  useEffect(() => {
    const selected = events.find((event) => event.id === selectedId);
    if (!selected || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [selected.longitude, selected.latitude],
      zoom: Math.max(mapRef.current.getZoom(), 4.2),
      duration: 900,
    });
  }, [events, selectedId]);

  return <div ref={containerRef} className="h-full w-full bg-[#0a1411]" aria-label="Mapa de eventos naturais" />;
}
