"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import { EMPTY_SITE, siteFromSettings, socialsFromSite, waLink, type SiteInfo } from "@/lib/site";

const SiteContext = createContext<SiteInfo>(EMPTY_SITE);

export function SiteProvider({
  site: initial,
  children,
}: {
  site: SiteInfo;
  children: ReactNode;
}) {
  const [site, setSite] = useState<SiteInfo>(() => ({
    ...EMPTY_SITE,
    ...initial,
    logoUrl: initial?.logoUrl ?? EMPTY_SITE.logoUrl,
    phones: initial?.phones ?? [],
    socialUrls: initial?.socialUrls ?? EMPTY_SITE.socialUrls,
  }));

  useEffect(() => {
    setSite({
      ...EMPTY_SITE,
      ...initial,
      logoUrl: initial?.logoUrl ?? EMPTY_SITE.logoUrl,
      phones: initial?.phones ?? [],
      socialUrls: initial?.socialUrls ?? EMPTY_SITE.socialUrls,
    });
  }, [initial]);

  // Pas de polling agressif : 1 refresh au mount si SSR incomplet, puis au focus (max 1×/min).
  useEffect(() => {
    let cancelled = false;
    let lastFocusFetch = 0;

    async function load() {
      try {
        const settings = await api.getSettings();
        if (!cancelled) setSite(siteFromSettings(settings));
      } catch {
        /* ignore */
      }
    }

    if (!initial?.whatsapp && !initial?.name) {
      load();
    }

    const onFocus = () => {
      const now = Date.now();
      if (now - lastFocusFetch < 60_000) return;
      lastFocusFetch = now;
      load();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, [initial]);

  return <SiteContext.Provider value={site}>{children}</SiteContext.Provider>;
}

export function useSite() {
  return useContext(SiteContext);
}

/** null si le numéro WhatsApp n’est pas configuré en admin */
export function useWaLink(text?: string): string | null {
  const site = useSite();
  return waLink(text, site.whatsapp);
}

export function useSocials() {
  return socialsFromSite(useSite());
}
