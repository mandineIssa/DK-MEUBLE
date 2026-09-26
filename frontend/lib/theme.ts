/** Thème clair Jumia — variables CSS globales (header, corps, accent partagé footer). */

export type SiteTheme = {
  header_bg: string;
  body_bg: string;
  content_bg_alt: string;
  text_primary: string;
  text_secondary: string;
  border_light: string;
  accent_primary: string;
  accent_primary_hover: string;
  price_color: string;
  price_strikethrough: string;
  success_color: string;
  danger_color: string;
  badge_bg: string;
  use_alt_bg_sections: boolean;
  header_compact_scroll: number;
  header_nav_bg: string;
};

export const DEFAULT_SITE_THEME: SiteTheme = {
  header_bg: "#ffffff",
  body_bg: "#ffffff",
  content_bg_alt: "#f5f5f5",
  text_primary: "#1a1a1a",
  text_secondary: "#6e6e6e",
  border_light: "#e0e0e0",
  accent_primary: "#f68b1e",
  accent_primary_hover: "#e07d16",
  price_color: "#f68b1e",
  price_strikethrough: "#9a9a9a",
  success_color: "#2e7d32",
  danger_color: "#d32f2f",
  badge_bg: "#f68b1e",
  use_alt_bg_sections: true,
  header_compact_scroll: 80,
  header_nav_bg: "#ffffff",
};

/** Mappe le thème API → variables CSS injectées sur :root / documentElement */
export function themeToCssVars(theme: Partial<SiteTheme>): Record<string, string> {
  const t = { ...DEFAULT_SITE_THEME, ...theme };
  return {
    "--header-bg": t.header_bg,
    "--header-nav-bg": t.header_nav_bg,
    "--body-bg": t.body_bg,
    "--content-bg-alt": t.content_bg_alt,
    "--text-primary": t.text_primary,
    "--text-secondary": t.text_secondary,
    "--border-light": t.border_light,
    "--accent-primary": t.accent_primary,
    "--accent-primary-hover": t.accent_primary_hover,
    "--price-color": t.price_color,
    "--price-strikethrough": t.price_strikethrough,
    "--success-color": t.success_color,
    "--danger-color": t.danger_color,
    "--badge-bg": t.badge_bg,
    /* Alias historiques / partagés */
    "--plp-accent": t.accent_primary,
    "--plp-accent-text": t.accent_primary,
    "--footer-accent": t.accent_primary,
    "--brand-orange": t.accent_primary,
    "--brand-orange-dark": t.accent_primary_hover,
  };
}

export function applyThemeToDocument(theme: Partial<SiteTheme>): void {
  if (typeof document === "undefined") return;
  const vars = themeToCssVars(theme);
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

export function normalizeTheme(raw: unknown): SiteTheme {
  const t = (raw && typeof raw === "object" ? raw : {}) as Partial<SiteTheme>;
  return {
    ...DEFAULT_SITE_THEME,
    ...t,
    use_alt_bg_sections:
      t.use_alt_bg_sections === undefined
        ? DEFAULT_SITE_THEME.use_alt_bg_sections
        : Boolean(t.use_alt_bg_sections),
    header_compact_scroll: Number(t.header_compact_scroll ?? DEFAULT_SITE_THEME.header_compact_scroll) || 80,
  };
}
