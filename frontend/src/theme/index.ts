export type Theme = "dark" | "light";

export const defaultTheme: Theme = "dark";

const STORAGE_KEY = "terra-alerta:theme";

const isTheme = (value: unknown): value is Theme => value === "dark" || value === "light";

const systemTheme = (): Theme =>
  window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : defaultTheme;

/** Ha escolha explicita salva? Enquanto nao houver, a interface segue o sistema. */
export const hasStoredTheme = (): boolean => {
  try {
    return isTheme(localStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
};

export const readStoredTheme = (): Theme => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isTheme(stored) ? stored : systemTheme();
  } catch {
    return defaultTheme;
  }
};

export const storeTheme = (theme: Theme) => {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Navegacao privada ou storage bloqueado: a escolha vale so nesta sessao.
  }
};

/* O mesmo atributo e escrito pelo script inline do index.html antes da primeira
   pintura; aqui so o mantemos em dia quando o tema muda em tempo de execucao.

   O data-theme-switching desliga as transicoes por um quadro: elementos com
   transition-all congelam a cor antiga quando a variavel CSS de origem muda, e
   sem transicao o navegador recalcula a cor na hora. De quebra, a troca de tema
   fica instantanea em vez de arrastar 200ms de fade em toda a tela. */
export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;

  root.dataset.themeSwitching = "";
  root.dataset.theme = theme;
  void root.offsetHeight; // forca o recalculo de estilo ainda sem transicao
  delete root.dataset.themeSwitching;
};

export const oppositeTheme = (theme: Theme): Theme => (theme === "dark" ? "light" : "dark");

/** Observa a preferencia do sistema e devolve a funcao de cancelamento. */
export const watchSystemTheme = (onChange: (theme: Theme) => void) => {
  const query = window.matchMedia("(prefers-color-scheme: light)");
  const handleChange = (event: MediaQueryListEvent) => onChange(event.matches ? "light" : "dark");

  query.addEventListener("change", handleChange);
  return () => query.removeEventListener("change", handleChange);
};

/* O mapa base tem uma folha de estilo por tema: o dark-matter apaga o oceano e o
   positron mantem o continente claro, ambos da mesma familia de tiles Carto. */
export const mapStyles: Record<Theme, string> = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
};
