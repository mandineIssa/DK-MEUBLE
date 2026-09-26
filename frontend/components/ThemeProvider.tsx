"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import {
  applyThemeToDocument,
  DEFAULT_SITE_THEME,
  normalizeTheme,
  type SiteTheme,
} from "@/lib/theme";

const ThemeContext = createContext<SiteTheme>(DEFAULT_SITE_THEME);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<SiteTheme>(DEFAULT_SITE_THEME);

  useEffect(() => {
    applyThemeToDocument(DEFAULT_SITE_THEME);

    let cancelled = false;
    api
      .getSettings()
      .then((settings) => {
        if (cancelled) return;
        const next = normalizeTheme((settings as { theme?: unknown }).theme);
        setTheme(next);
        applyThemeToDocument(next);
      })
      .catch(() => {
        /* garde les défauts */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): SiteTheme {
  return useContext(ThemeContext);
}
