import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  dictionaries,
  languages,
  readStoredLanguage,
  relativeTime,
  storeLanguage,
  type Language,
} from "../i18n";
import { getEvents } from "../services/eventsApi";
import type { EventCategory, GeoEvent } from "../types/events";

const categoryMeta: Record<EventCategory, { icon: typeof Activity; color: string }> = {
  earthquake: { icon: Waves, color: "#f0a94b" },
  wildfire: { icon: Flame, color: "#ef665d" },
  storm: { icon: Wind, color: "#62a8ff" },
  volcano: { icon: Activity, color: "#c47bff" },
};

const categoryOrder: EventCategory[] = ["earthquake", "wildfire", "storm", "volcano"];

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
  const [selected, setSelected] = useState<GeoEvent | null>(previewEvents[1]);
  const [language, setLanguage] = useState<Language>(readStoredLanguage);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  const t = dictionaries[language];

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(t.locale);
    return events.filter((event) => {
      const matchesCategory = activeCategories.includes(event.category);
      const matchesQuery =
        !normalizedQuery ||
        `${event.title} ${event.location}`.toLocaleLowerCase(t.locale).includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategories, events, query, t.locale]);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const liveEvents = await getEvents();
      if (liveEvents.length) {
        setEvents(liveEvents);
        setSelected((current) => (current === null ? null : liveEvents[0]));
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

  useEffect(() => {
    document.documentElement.lang = t.htmlLang;
    storeLanguage(language);
  }, [language, t.htmlLang]);

  useEffect(() => {
    if (!isLanguageMenuOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!languageMenuRef.current?.contains(event.target as Node)) setIsLanguageMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsLanguageMenuOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isLanguageMenuOpen]);

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
        <div className="flex min-w-[228px] items-center gap-3">
          <div className="relative grid h-9 w-9 place-items-center rounded-xl border border-[#8ee6a8]/30 bg-[#8ee6a8]/10">
            <Globe2 size={20} strokeWidth={1.8} className="text-[#a9f4bd]" />
            <span className="absolute right-[7px] top-[7px] h-1.5 w-1.5 rounded-full bg-[#ff725f]" />
          </div>
          <div>
            <p className="text-[17px] font-extrabold leading-none tracking-[-0.04em]">TerraAlerta</p>
            <p className="mt-1 whitespace-nowrap text-[9px] font-bold uppercase tracking-[.18em] text-[#71867b]">{t.tagline}</p>
          </div>
        </div>

        <label className="mx-auto hidden h-10 w-full max-w-[470px] items-center gap-2.5 rounded-xl border border-white/10 bg-white/[.045] px-3.5 focus-within:border-[#8ee6a8]/50 lg:flex">
          <Search size={16} className="text-[#778c82]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#60736a]"
          />
          <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-[#64776e]">⌘ K</span>
        </label>

        <div className="ml-auto flex min-w-[228px] items-center justify-end gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-[#8ee6a8]/15 bg-[#8ee6a8]/[.07] px-3 py-1.5 sm:flex">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-[#8ee6a8]" />
            <span className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#a8e7b8]">{t.live}</span>
          </div>
          <button
            aria-label={t.refresh}
            onClick={() => void loadEvents()}
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-[#9caf9f] transition-all duration-200 hover:border-white/20 hover:bg-white/[.08] hover:text-[#e9f1ec] motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-95"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          <div ref={languageMenuRef} className="relative hidden sm:block">
            <button
              aria-label={t.language}
              aria-haspopup="listbox"
              aria-expanded={isLanguageMenuOpen}
              onClick={() => setIsLanguageMenuOpen((open) => !open)}
              className="flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 text-xs font-semibold text-[#c5d1cb] transition-all duration-200 hover:border-white/20 hover:bg-white/[.08] hover:text-[#e9f1ec] motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0"
            >
              {languages.find((item) => item.code === language)?.label}
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${isLanguageMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isLanguageMenuOpen && (
              <ul
                role="listbox"
                aria-label={t.language}
                className="panel-in absolute right-0 top-11 z-30 w-36 rounded-xl border border-white/10 bg-[#0c1713]/95 p-1 shadow-[0_18px_50px_rgba(0,0,0,.55)] backdrop-blur-xl"
              >
                {languages.map((item) => (
                  <li key={item.code} role="option" aria-selected={item.code === language}>
                    <button
                      onClick={() => {
                        setLanguage(item.code);
                        setIsLanguageMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition-all duration-200 hover:bg-white/[.08] motion-safe:hover:translate-x-0.5 ${
                        item.code === language ? "text-[#a9f4bd]" : "text-[#c5d1cb]"
                      }`}
                    >
                      {item.name}
                      <span className="text-[10px] font-extrabold tracking-wider text-[#71867b]">{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </header>

      <div className="grid h-[calc(100dvh-72px)] min-h-[588px] grid-rows-[minmax(0,1fr)] grid-cols-1 lg:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="relative z-10 hidden min-h-0 flex-col border-r border-white/10 bg-[#0b1512] lg:flex">
          <div className="border-b border-white/10 px-5 py-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#71867b]">{t.overview}</p>
                <p className="mt-1 text-2xl font-extrabold tracking-[-0.045em]">{t.activeEvents}</p>
              </div>
              <span className="rounded-lg bg-[#8ee6a8]/10 px-2.5 py-1 text-sm font-extrabold text-[#9ef0b4]">{filteredEvents.length}</span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              {categoryOrder.map((key) => {
                const meta = categoryMeta[key];
                const Icon = meta.icon;
                const active = activeCategories.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleCategory(key)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-[11px] font-bold transition-all duration-200 hover:border-white/20 hover:bg-white/[.08] hover:text-[#dce7e1] motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 ${
                      active ? "border-white/10 bg-white/[.06] text-[#dce7e1]" : "border-transparent bg-black/10 text-[#566a60]"
                    }`}
                  >
                    <Icon size={15} style={{ color: active ? meta.color : "currentColor" }} />
                    {t.categories[key]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between px-5 pb-3 pt-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#71867b]">{t.mostRecent}</p>
            <span className={`text-[9px] font-bold uppercase tracking-wider ${usingPreview ? "text-[#f0a94b]" : "text-[#91dca6]"}`}>
              {usingPreview ? t.previewData : t.officialSources}
            </span>
          </div>

          <div className="scrollbar-subtle flex-1 overflow-y-auto px-3 pb-4">
            {filteredEvents.map((event) => {
              const meta = categoryMeta[event.category];
              const Icon = meta.icon;
              const isSelected = event.id === selected?.id;
              return (
                <button
                  key={event.id}
                  onClick={() => setSelected(event)}
                  className={`mb-1.5 w-full rounded-2xl border p-3.5 text-left transition-all duration-200 motion-safe:hover:translate-x-1 ${
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
                        <span className="shrink-0 text-[9px] font-semibold text-[#60736a]">{relativeTime(event.occurredAt, t)}</span>
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
            {t.disclaimer}
          </div>
        </aside>

        <section className="relative min-h-0 overflow-hidden">
          <AlertMap events={filteredEvents} selectedId={selected?.id} language={language} onSelect={handleSelect} />

          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#07100d]/65 to-transparent" />

          <div className="absolute left-4 top-4 flex gap-2 lg:left-6 lg:top-5">
            <div className="rounded-xl border border-white/10 bg-[#0c1713]/90 px-3.5 py-2.5 shadow-2xl backdrop-blur-xl">
              <p className="text-[9px] font-bold uppercase tracking-[.15em] text-[#71867b]">{t.monitoredWindow}</p>
              <p className="mt-0.5 flex items-center gap-2 text-xs font-extrabold"><Clock3 size={13} className="text-[#8ee6a8]" /> {t.last48h}</p>
            </div>
          </div>

          {selected && (
            <div className="panel-in absolute bottom-4 left-4 right-4 rounded-[22px] border border-white/10 bg-[#0c1713]/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,.5)] backdrop-blur-2xl sm:left-auto sm:right-6 sm:w-[380px] sm:p-5">
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
                    <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#71867b]">{t.categoriesSingular[selected.category]}</p>
                    <h2 className="mt-0.5 text-sm font-extrabold tracking-[-0.02em]">{selected.title}</h2>
                  </div>
                </div>
                <button
                  aria-label={t.closeDetails}
                  onClick={() => setSelected(null)}
                  className="grid h-7 w-7 place-items-center rounded-lg text-[#6c8176] transition-all duration-200 hover:bg-white/[.08] hover:text-[#e9f1ec] motion-safe:hover:rotate-90 motion-safe:active:scale-90"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2 text-[11px] text-[#8ca096]">
                <MapPin size={13} className="text-[#8ee6a8]" /> {selected.location}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-[#91a39a]">{selected.description}</p>

              <div className="mt-4 grid grid-cols-3 gap-2 border-y border-white/10 py-3">
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-[#5f7369]">{t.intensity}</p>
                  <p className="mt-1 text-xs font-extrabold capitalize text-[#dce7e1]">{selected.magnitude ? `M ${selected.magnitude}` : t.severity[selected.severity]}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-[#5f7369]">{t.updated}</p>
                  <p className="mt-1 text-xs font-extrabold text-[#dce7e1]">{relativeTime(selected.occurredAt, t)}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-[#5f7369]">{t.source}</p>
                  <p className="mt-1 text-xs font-extrabold text-[#dce7e1]">{selected.source}</p>
                </div>
              </div>

              <a href={selected.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 flex h-10 items-center justify-center gap-2 rounded-xl bg-[#a9f4bd] text-[11px] font-extrabold text-[#0a1711] transition-all duration-200 hover:bg-[#c3ffd1] hover:shadow-[0_10px_26px_rgba(169,244,189,.28)] motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0">
                {t.openOfficialSource} <ExternalLink size={13} />
              </a>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
