import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ChevronDown,
  Clock3,
  ExternalLink,
  Flame,
  Globe2,
  MapPin,
  RefreshCw,
  Search,
  Waves,
  Wind,
  X,
} from "lucide-react";
import AlertMap from "../components/AlertMap";
import { previewEvents } from "../data/previewEvents";
import { getEvents } from "../services/eventsApi";
import type { EventCategory, GeoEvent } from "../types/events";

const categoryMeta: Record<EventCategory, { label: string; icon: typeof Activity; color: string }> = {
  earthquake: { label: "Terremotos", icon: Waves, color: "#f0a94b" },
  wildfire: { label: "Incêndios", icon: Flame, color: "#ef665d" },
  storm: { label: "Tempestades", icon: Wind, color: "#62a8ff" },
  volcano: { label: "Vulcões", icon: Activity, color: "#c47bff" },
};

const severityLabel: Record<GeoEvent["severity"], string> = {
  low: "Baixa",
  moderate: "Moderada",
  high: "Alta",
};

const relativeTime = (date: string) => {
  const hours = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 3_600_000));
  return hours < 24 ? `há ${hours}h` : `há ${Math.round(hours / 24)}d`;
};

export default function DashboardPage() {
  const [events, setEvents] = useState<GeoEvent[]>(previewEvents);
  const [isLoading, setIsLoading] = useState(true);
  const [usingPreview, setUsingPreview] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategories, setActiveCategories] = useState<EventCategory[]>([
    "earthquake",
    "wildfire",
    "storm",
    "volcano",
  ]);
  const [selected, setSelected] = useState<GeoEvent>(previewEvents[1]);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    return events.filter((event) => {
      const matchesCategory = activeCategories.includes(event.category);
      const matchesQuery =
        !normalizedQuery ||
        `${event.title} ${event.location}`.toLocaleLowerCase("pt-BR").includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategories, events, query]);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const liveEvents = await getEvents();
      if (liveEvents.length) {
        setEvents(liveEvents);
        setSelected(liveEvents[0]);
        setUsingPreview(false);
      }
    } catch {
      setUsingPreview(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const toggleCategory = (category: EventCategory) => {
    setActiveCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  };

  const handleSelect = useCallback((event: GeoEvent) => setSelected(event), []);

  return (
    <main className="h-dvh min-h-[660px] overflow-hidden bg-[#07100d] text-[#e9f1ec]">
      <header className="relative z-20 flex h-[72px] items-center border-b border-white/10 bg-[#0b1512]/95 px-4 backdrop-blur-xl md:px-6">
        <div className="flex min-w-[210px] items-center gap-3">
          <div className="relative grid h-9 w-9 place-items-center rounded-xl border border-[#8ee6a8]/30 bg-[#8ee6a8]/10">
            <Globe2 size={20} strokeWidth={1.8} className="text-[#a9f4bd]" />
            <span className="absolute right-[7px] top-[7px] h-1.5 w-1.5 rounded-full bg-[#ff725f]" />
          </div>
          <div>
            <p className="text-[17px] font-extrabold leading-none tracking-[-0.04em]">TerraAlerta</p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[.18em] text-[#71867b]">Monitor global</p>
          </div>
        </div>

        <label className="mx-auto hidden h-10 w-full max-w-[470px] items-center gap-2.5 rounded-xl border border-white/10 bg-white/[.045] px-3.5 focus-within:border-[#8ee6a8]/50 lg:flex">
          <Search size={16} className="text-[#778c82]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar evento ou região"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#60736a]"
          />
          <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-[#64776e]">⌘ K</span>
        </label>

        <div className="ml-auto flex min-w-[210px] items-center justify-end gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-[#8ee6a8]/15 bg-[#8ee6a8]/[.07] px-3 py-1.5 sm:flex">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-[#8ee6a8]" />
            <span className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#a8e7b8]">Ao vivo</span>
          </div>
          <button
            aria-label="Atualizar eventos"
            onClick={() => void loadEvents()}
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-[#9caf9f] hover:bg-white/[.08]"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          <button className="hidden h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 text-xs font-semibold text-[#c5d1cb] sm:flex">
            PT <ChevronDown size={13} />
          </button>
        </div>
      </header>

      <div className="grid h-[calc(100dvh-72px)] min-h-[588px] grid-rows-[minmax(0,1fr)] grid-cols-1 lg:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="relative z-10 hidden min-h-0 flex-col border-r border-white/10 bg-[#0b1512] lg:flex">
          <div className="border-b border-white/10 px-5 py-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#71867b]">Visão geral</p>
                <p className="mt-1 text-2xl font-extrabold tracking-[-0.045em]">Eventos ativos</p>
              </div>
              <span className="rounded-lg bg-[#8ee6a8]/10 px-2.5 py-1 text-sm font-extrabold text-[#9ef0b4]">{filteredEvents.length}</span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              {(Object.entries(categoryMeta) as [EventCategory, (typeof categoryMeta)[EventCategory]][]).map(([key, meta]) => {
                const Icon = meta.icon;
                const active = activeCategories.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleCategory(key)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-[11px] font-bold transition ${
                      active ? "border-white/10 bg-white/[.06] text-[#dce7e1]" : "border-transparent bg-black/10 text-[#566a60]"
                    }`}
                  >
                    <Icon size={15} style={{ color: active ? meta.color : "currentColor" }} />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between px-5 pb-3 pt-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#71867b]">Mais recentes</p>
            <span className={`text-[9px] font-bold uppercase tracking-wider ${usingPreview ? "text-[#f0a94b]" : "text-[#91dca6]"}`}>
              {usingPreview ? "Dados de demonstração" : "Fontes oficiais"}
            </span>
          </div>

          <div className="scrollbar-subtle flex-1 overflow-y-auto px-3 pb-4">
            {filteredEvents.map((event) => {
              const meta = categoryMeta[event.category];
              const Icon = meta.icon;
              const isSelected = event.id === selected.id;
              return (
                <button
                  key={event.id}
                  onClick={() => setSelected(event)}
                  className={`mb-1.5 w-full rounded-2xl border p-3.5 text-left transition ${
                    isSelected
                      ? "border-[#8ee6a8]/25 bg-[#8ee6a8]/[.075] shadow-[inset_3px_0_0_#8ee6a8]"
                      : "border-transparent hover:border-white/10 hover:bg-white/[.035]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl" style={{ color: meta.color, background: `${meta.color}18` }}>
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-[12px] font-extrabold text-[#e1eae5]">{event.title}</p>
                        <span className="shrink-0 text-[9px] font-semibold text-[#60736a]">{relativeTime(event.occurredAt)}</span>
                      </div>
                      <p className="mt-1 flex items-center gap-1 truncate text-[10px] text-[#788d82]">
                        <MapPin size={10} /> {event.location}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="border-t border-white/10 px-5 py-3.5 text-[9px] leading-relaxed text-[#5e7167]">
            Dados informativos. Em uma emergência, consulte as autoridades locais.
          </div>
        </aside>

        <section className="relative min-h-0 overflow-hidden">
          <AlertMap events={filteredEvents} selectedId={selected.id} onSelect={handleSelect} />

          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#07100d]/65 to-transparent" />

          <div className="absolute left-4 top-4 flex gap-2 lg:left-6 lg:top-5">
            <div className="rounded-xl border border-white/10 bg-[#0c1713]/90 px-3.5 py-2.5 shadow-2xl backdrop-blur-xl">
              <p className="text-[9px] font-bold uppercase tracking-[.15em] text-[#71867b]">Janela monitorada</p>
              <p className="mt-0.5 flex items-center gap-2 text-xs font-extrabold"><Clock3 size={13} className="text-[#8ee6a8]" /> Últimas 48 horas</p>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4 rounded-[22px] border border-white/10 bg-[#0c1713]/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,.5)] backdrop-blur-2xl sm:left-auto sm:right-6 sm:w-[380px] sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = categoryMeta[selected.category].icon;
                  return (
                    <span className="grid h-10 w-10 place-items-center rounded-2xl" style={{ color: categoryMeta[selected.category].color, background: `${categoryMeta[selected.category].color}19` }}>
                      <Icon size={19} />
                    </span>
                  );
                })()}
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#71867b]">{categoryMeta[selected.category].label.slice(0, -1)}</p>
                  <h2 className="mt-0.5 text-sm font-extrabold tracking-[-0.02em]">{selected.title}</h2>
                </div>
              </div>
              <button aria-label="Fechar detalhes" className="grid h-7 w-7 place-items-center rounded-lg text-[#6c8176] hover:bg-white/[.06]">
                <X size={15} />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[11px] text-[#8ca096]">
              <MapPin size={13} className="text-[#8ee6a8]" /> {selected.location}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-[#91a39a]">{selected.description}</p>

            <div className="mt-4 grid grid-cols-3 gap-2 border-y border-white/10 py-3">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-[#5f7369]">Intensidade</p>
                <p className="mt-1 text-xs font-extrabold capitalize text-[#dce7e1]">{selected.magnitude ? `M ${selected.magnitude}` : severityLabel[selected.severity]}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-[#5f7369]">Atualizado</p>
                <p className="mt-1 text-xs font-extrabold text-[#dce7e1]">{relativeTime(selected.occurredAt)}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-[#5f7369]">Fonte</p>
                <p className="mt-1 text-xs font-extrabold text-[#dce7e1]">{selected.source}</p>
              </div>
            </div>

            <a href={selected.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 flex h-10 items-center justify-center gap-2 rounded-xl bg-[#a9f4bd] text-[11px] font-extrabold text-[#0a1711] transition hover:bg-[#c3ffd1]">
              Abrir fonte oficial <ExternalLink size={13} />
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
