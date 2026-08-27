import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ChevronDown,
  Clock3,
  ExternalLink,
  Flame,
  Globe2,
  MapPin,
  Moon,
  RefreshCw,
  Search,
  Sun,
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
import {
  applyTheme,
  hasStoredTheme,
  oppositeTheme,
  readStoredTheme,
  storeTheme,
  watchSystemTheme,
  type Theme,
} from "../theme";
import type { EventCategory, GeoEvent } from "../types/events";

// Cor e tinta saem do tema corrente: no claro os mesmos matizes precisam ser
// mais escuros para manter contraste sobre o painel branco.
const categoryMeta: Record<EventCategory, { icon: typeof Activity; color: string; tint: string }> = {
  earthquake: { icon: Waves, color: "var(--quake)", tint: "var(--quake-tint)" },
  wildfire: { icon: Flame, color: "var(--fire)", tint: "var(--fire-tint)" },
  storm: { icon: Wind, color: "var(--storm)", tint: "var(--storm-tint)" },
  volcano: { icon: Activity, color: "var(--volcano)", tint: "var(--volcano-tint)" },
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
  const [theme, setTheme] = useState<Theme>(readStoredTheme);
  const [followsSystem, setFollowsSystem] = useState(() => !hasStoredTheme());

  const t = dictionaries[language];
  const nextTheme = oppositeTheme(theme);
  const themeLabel = t.activateTheme(t.themeNames[nextTheme]);

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
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    // Enquanto nao houver escolha explicita, a interface acompanha o sistema.
    if (!followsSystem) return;
    return watchSystemTheme(setTheme);
  }, [followsSystem]);

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

  const switchTheme = () => {
    setFollowsSystem(false);
    setTheme(nextTheme);
    storeTheme(nextTheme);
  };

  const handleSelect = useCallback((event: GeoEvent) => setSelected(event), []);

  return (
    <main className="h-dvh min-h-[660px] overflow-hidden bg-canvas text-ink">
      <header className="relative z-20 flex h-[72px] items-center border-b border-line bg-panel/95 px-4 backdrop-blur-xl md:px-6">
        <div className="flex min-w-[228px] items-center gap-3">
          <div className="relative grid h-9 w-9 place-items-center rounded-xl border border-accent/30 bg-accent/10">
            <Globe2 size={20} strokeWidth={1.8} className="text-accent-soft" />
            <span className="absolute right-[7px] top-[7px] h-1.5 w-1.5 rounded-full bg-alert" />
          </div>
          <div>
            <p className="text-[17px] font-extrabold leading-none tracking-[-0.04em]">TerraAlerta</p>
            <p className="mt-1 whitespace-nowrap text-[9px] font-bold uppercase tracking-[.18em] text-ink-faint">{t.tagline}</p>
          </div>
        </div>

        <label className="mx-auto hidden h-10 w-full max-w-[470px] items-center gap-2.5 rounded-xl border border-line bg-fill px-3.5 focus-within:border-accent/50 lg:flex">
          <Search size={16} className="text-ink-ghost" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-ghost"
          />
          <span className="rounded-md border border-line px-1.5 py-0.5 text-[10px] text-ink-ghost">&#8984; K</span>
        </label>

        <div className="ml-auto flex min-w-[228px] items-center justify-end gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-accent/15 bg-accent/[.07] px-3 py-1.5 sm:flex">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[10px] font-extrabold uppercase tracking-[.16em] text-accent-soft">{t.live}</span>
          </div>
          <button
            aria-label={t.refresh}
            onClick={() => void loadEvents()}
            className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-fill text-ink-muted transition-all duration-200 hover:border-line-strong hover:bg-fill-strong hover:text-ink motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-95"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          <button
            aria-label={themeLabel}
            title={themeLabel}
            onClick={switchTheme}
            className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-fill text-ink-muted transition-all duration-200 hover:border-line-strong hover:bg-fill-strong hover:text-ink motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-95"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <div ref={languageMenuRef} className="relative hidden sm:block">
            <button
              aria-label={t.language}
              aria-haspopup="listbox"
              aria-expanded={isLanguageMenuOpen}
              onClick={() => setIsLanguageMenuOpen((open) => !open)}
              className="flex h-9 items-center gap-2 rounded-xl border border-line bg-fill px-3 text-xs font-semibold text-ink-soft transition-all duration-200 hover:border-line-strong hover:bg-fill-strong hover:text-ink motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0"
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
                className="panel-in absolute right-0 top-11 z-30 w-36 rounded-xl border border-line bg-elevated/95 p-1 shadow-[var(--shadow-pop)] backdrop-blur-xl"
              >
                {languages.map((item) => (
                  <li key={item.code} role="option" aria-selected={item.code === language}>
                    <button
                      onClick={() => {
                        setLanguage(item.code);
                        setIsLanguageMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition-all duration-200 hover:bg-fill-strong motion-safe:hover:translate-x-0.5 ${
                        item.code === language ? "text-accent-soft" : "text-ink-soft"
                      }`}
                    >
                      {item.name}
                      <span className="text-[10px] font-extrabold tracking-wider text-ink-faint">{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </header>

      <div className="grid h-[calc(100dvh-72px)] min-h-[588px] grid-rows-[minmax(0,1fr)] grid-cols-1 lg:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="relative z-10 hidden min-h-0 flex-col border-r border-line bg-panel lg:flex">
          <div className="border-b border-line px-5 py-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-ink-faint">{t.overview}</p>
                <p className="mt-1 text-2xl font-extrabold tracking-[-0.045em]">{t.activeEvents}</p>
              </div>
              <span className="rounded-lg bg-accent/10 px-2.5 py-1 text-sm font-extrabold text-accent-soft">{filteredEvents.length}</span>
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
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-[11px] font-bold transition-all duration-200 hover:border-line-strong hover:bg-fill-strong hover:text-ink-soft motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 ${
                      active ? "border-line bg-fill-strong text-ink-soft" : "border-transparent bg-sunken text-ink-ghost"
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
            <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-ink-faint">{t.mostRecent}</p>
            <span className={`text-[9px] font-bold uppercase tracking-wider ${usingPreview ? "text-warn" : "text-accent-soft"}`}>
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
                      ? "border-accent/25 bg-accent/[.075] shadow-[inset_3px_0_0_var(--accent)]"
                      : "border-transparent hover:border-line hover:bg-fill"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl" style={{ color: meta.color, background: meta.tint }}>
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-[12px] font-extrabold text-ink-soft">{event.title}</p>
                        <span className="shrink-0 text-[9px] font-semibold text-ink-ghost">{relativeTime(event.occurredAt, t)}</span>
                      </div>
                      <p className="mt-1 flex items-center gap-1 truncate text-[10px] text-ink-muted">
                        <MapPin size={10} /> {event.location}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="border-t border-line px-5 py-3.5 text-[9px] leading-relaxed text-ink-ghost">
            {t.disclaimer}
          </div>
        </aside>

        <section className="relative min-h-0 overflow-hidden">
          <AlertMap events={filteredEvents} selectedId={selected?.id} language={language} theme={theme} onSelect={handleSelect} />

          <div className="map-scrim pointer-events-none absolute inset-x-0 top-0 h-28" />

          <div className="absolute left-4 top-4 flex gap-2 lg:left-6 lg:top-5">
            <div className="rounded-xl border border-line bg-elevated/90 px-3.5 py-2.5 shadow-[var(--shadow-pop)] backdrop-blur-xl">
              <p className="text-[9px] font-bold uppercase tracking-[.15em] text-ink-faint">{t.coverage}</p>
              <p className="mt-0.5 flex items-center gap-2 text-xs font-extrabold"><Clock3 size={13} className="text-accent" /> {t.coverageDetail}</p>
            </div>
          </div>

          {selected && (
            <div className="panel-in absolute bottom-4 left-4 right-4 rounded-[22px] border border-line bg-elevated/95 p-4 shadow-[var(--shadow-panel)] backdrop-blur-2xl sm:left-auto sm:right-6 sm:w-[380px] sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {(() => {
                    const meta = categoryMeta[selected.category];
                    const Icon = meta.icon;
                    return (
                      <span className="grid h-10 w-10 place-items-center rounded-2xl" style={{ color: meta.color, background: meta.tint }}>
                        <Icon size={19} />
                      </span>
                    );
                  })()}
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-ink-faint">{t.categoriesSingular[selected.category]}</p>
                    <h2 className="mt-0.5 text-sm font-extrabold tracking-[-0.02em]">{selected.title}</h2>
                  </div>
                </div>
                <button
                  aria-label={t.closeDetails}
                  onClick={() => setSelected(null)}
                  className="grid h-7 w-7 place-items-center rounded-lg text-ink-ghost transition-all duration-200 hover:bg-fill-strong hover:text-ink motion-safe:hover:rotate-90 motion-safe:active:scale-90"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2 text-[11px] text-ink-muted">
                <MapPin size={13} className="text-accent" /> {selected.location}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">{selected.description}</p>

              <div className="mt-4 grid grid-cols-3 gap-2 border-y border-line py-3">
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-ink-ghost">{t.intensity}</p>
                  <p className="mt-1 text-xs font-extrabold capitalize text-ink-soft">{selected.magnitude ? `M ${selected.magnitude}` : t.severity[selected.severity]}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-ink-ghost">{t.updated}</p>
                  <p className="mt-1 text-xs font-extrabold text-ink-soft">{relativeTime(selected.occurredAt, t)}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-ink-ghost">{t.source}</p>
                  <p className="mt-1 text-xs font-extrabold text-ink-soft">{selected.source}</p>
                </div>
              </div>

              <a href={selected.sourceUrl} target="_blank" rel="noreferrer" className="mt-4 flex h-10 items-center justify-center gap-2 rounded-xl bg-accent-solid text-[11px] font-extrabold text-accent-on transition-all duration-200 hover:bg-accent-solid-hover hover:shadow-[var(--shadow-glow)] motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0">
                {t.openOfficialSource} <ExternalLink size={13} />
              </a>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
