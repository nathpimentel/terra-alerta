import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import { dictionaries, type Language } from "../i18n";
import { mapStyles, type Theme } from "../theme";
import { isOnEarth, type GeoEvent } from "../types/events";

/* Por padrao o MapLibre repete o planeta infinitamente ao arrastar para os
   lados. Estes limites prendem a navegacao a uma unica copia do mundo: da para
   percorrer de um continente ao outro, mas o mapa encosta na borda em vez de
   recomecar. 85 graus e onde a projecao de Mercator deixa de ser util.

   A longitude para em 179.9 e nao em 180 de proposito: o MapLibre passa esses
   limites por um wrap, e wrap(180) devolve -180. Com as duas pontas em 180 a
   faixa colapsa para largura zero, o mapa divide a viewport por zero e nasce
   travado no zoom maximo. Recuar um decimo de grau mantem o mundo inteiro
   alcancavel e evita o colapso. */
const worldBounds: maplibregl.LngLatBoundsLike = [
  [-179.9, -85],
  [179.9, 85],
];

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
      // Sem piso fixo: o proprio maxBounds impede de afastar alem do ponto em
      // que o mundo preenche a largura, o que se ajusta ao tamanho da tela. Um
      // minZoom fixo de 1.2 deixava 19% do globo inalcancavel neste layout.
      minZoom: 0,
      maxBounds: worldBounds,
      renderWorldCopies: false,
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
