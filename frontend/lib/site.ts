import { api, SiteSettings } from "@/lib/api";

export type SiteSocial = {
  label: string;
  href: string;
  /** Couleur / dégradé CSS (évite les classes Tailwind dynamiques invisibles) */
  background: string;
  /** Icône claire sur fond sombre, ou sombre sur fond clair */
  iconClass: string;
  path: string;
};

export type SiteInfo = {
  name: string;
  logoUrl: string;
  url: string;
  whatsapp: string;
  phoneDisplay: string;
  phoneTel: string;
  /** Numéros pour le popover « appel » (admin → Paramètres) */
  phones: string[];
  email: string;
  address: string;
  hours: string;
  mapsEmbed: string;
  trust: string[];
  seoTitle: string;
  seoDescription: string;
  socialUrls: SiteSettings["socials"];
};

const SOCIAL_META: Omit<SiteSocial, "href">[] = [
  {
    label: "Facebook",
    background: "#1877F2",
    iconClass: "fill-white",
    path: "M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H8v3h3v7h3v-7h3l1-3h-4V9c0-.6.4-1 1-1Z",
  },
  {
    label: "TikTok",
    background: "#FFFFFF",
    iconClass: "fill-black",
    path: "M16.5 4c.5 1.6 1.7 2.9 3.3 3.4v2.4a6.8 6.8 0 0 1-3.3-1v6.4a5.3 5.3 0 1 1-5.3-5.3c.3 0 .6 0 .9.1v2.5a2.8 2.8 0 1 0 2 2.7V4h2.4Z",
  },
  {
    label: "YouTube",
    background: "#FF0000",
    iconClass: "fill-white",
    path: "M21.6 8.2a2.5 2.5 0 0 0-1.8-1.8C18.2 6 12 6 12 6s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 8.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 3.8 2.5 2.5 0 0 0 1.8 1.8C5.8 18 12 18 12 18s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-3.8ZM10 15V9l5.2 3L10 15Z",
  },
  {
    label: "Instagram",
    background: "linear-gradient(135deg, #F58529 0%, #DD2A7B 50%, #8134AF 100%)",
    iconClass: "fill-white",
    path: "M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2Zm0 7.9a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2Zm5.9-8.2a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM12 3.5c-2.3 0-2.6 0-3.5.1-2.2.1-3.4 1.3-3.5 3.5-.1.9-.1 1.2-.1 3.5s0 2.6.1 3.5c.1 2.2 1.3 3.4 3.5 3.5.9.1 1.2.1 3.5.1s2.6 0 3.5-.1c2.2-.1 3.4-1.3 3.5-3.5.1-.9.1-1.2.1-3.5s0-2.6-.1-3.5c-.1-2.2-1.3-3.4-3.5-3.5-.9-.1-1.2-.1-3.5-.1Z",
  },
];

/** Valeurs vides : contact / réseaux viennent uniquement de l’admin (API). */
export const EMPTY_SITE: SiteInfo = {
  name: "DK HOMETECH",
  logoUrl: "",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  whatsapp: "",
  phoneDisplay: "",
  phoneTel: "",
  phones: [],
  email: "",
  address: "",
  hours: "",
  mapsEmbed: "",
  trust: ["Qualité", "Livraison partout au Sénégal", "Service de confiance"],
  seoTitle: "DK HOMETECH",
  seoDescription: "",
  socialUrls: {
    facebook: "",
    tiktok: "",
    youtube: "",
    instagram: "",
  },
};

/** @deprecated Utiliser getSite() — uniquement l’URL du site pour sitemap/robots */
export const SITE = {
  name: EMPTY_SITE.name,
  url: EMPTY_SITE.url,
};

export function siteFromSettings(settings: SiteSettings): SiteInfo {
  const c = settings.contact || {};
  const brand = settings.brand ?? { name: "", logo_url: "" };
  const trustRaw = settings.footer?.trust;
  const trust =
    Array.isArray(trustRaw) && trustRaw.filter(Boolean).length
      ? trustRaw.filter((t): t is string => Boolean(t))
      : EMPTY_SITE.trust;

  const phoneDisplay = String(c.phone_display || "").trim();
  const phoneTel = String(c.phone_tel || phoneDisplay || "").replace(/\s/g, "");
  const phonesRaw = String((c as { phones?: string }).phones || "");
  const phonesFromList = phonesRaw
    .split(/[\n,;]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const phones =
    phonesFromList.length > 0
      ? phonesFromList
      : [phoneDisplay, phoneTel].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

  const rawWhatsapp = String(c.whatsapp || "").replace(/\D/g, "");
  // SN local 9 chiffres (7x…) → préfixe 221 pour wa.me
  const whatsapp =
    rawWhatsapp.length === 9 && rawWhatsapp.startsWith("7")
      ? `221${rawWhatsapp}`
      : rawWhatsapp;

  const logoRaw = String(brand.logo_url || "").trim();
  const name = String(brand.name || "").trim() || EMPTY_SITE.name;
  const socials = settings.socials || {};

  return {
    name,
    logoUrl: logoRaw,
    url: EMPTY_SITE.url,
    whatsapp,
    phoneDisplay,
    phoneTel,
    phones: Array.isArray(phones) ? phones : [],
    email: String(c.email || "").trim(),
    address: String(c.address || "").trim(),
    hours: String(c.hours || "").trim(),
    mapsEmbed: normalizeMapsEmbedUrl(String(c.maps_embed || "")) || "",
    trust,
    seoTitle: settings.seo?.title || EMPTY_SITE.seoTitle,
    seoDescription: settings.seo?.description || "",
    socialUrls: {
      facebook: String(socials.facebook || "").trim(),
      instagram: String(socials.instagram || "").trim(),
      tiktok: String(socials.tiktok || "").trim(),
      youtube: String(socials.youtube || "").trim(),
    },
  };
}

/**
 * Convertit une saisie admin (URL Maps, iframe HTML, adresse) en URL
 * embarquable dans une iframe. google.com seul est refusé par Google (X-Frame-Options).
 */
export function normalizeMapsEmbedUrl(raw: string): string | null {
  let v = String(raw || "").trim();
  if (!v) return null;

  const iframeSrc = v.match(/src=["']([^"']+)["']/i);
  if (iframeSrc?.[1]) v = iframeSrc[1].trim();

  if (!/^https?:\/\//i.test(v) && !/^\/\//.test(v)) {
    // Texte d’adresse → recherche Maps embarquée
    return `https://www.google.com/maps?q=${encodeURIComponent(v)}&output=embed`;
  }
  if (/^\/\//.test(v)) v = `https:${v}`;

  try {
    const u = new URL(v);
    const host = u.hostname.toLowerCase();
    const isGoogle =
      host === "google.com" ||
      host.endsWith(".google.com") ||
      host === "maps.google.com" ||
      host === "goo.gl" ||
      host.endsWith(".goo.gl");

    // Accueil Google / page non Maps → non embarquable
    if (isGoogle && !/maps/i.test(u.pathname + u.search + u.hostname)) {
      return null;
    }
    if (host === "google.com" || host === "www.google.com") {
      if (u.pathname === "/" || u.pathname === "") return null;
    }

    // Déjà un embed officiel
    if (/\/maps\/embed/i.test(u.pathname) || u.searchParams.get("output") === "embed") {
      return u.toString();
    }

    // Lien Maps / partage → version embed
    if (isGoogle || /maps/i.test(u.pathname)) {
      return `https://www.google.com/maps?q=${encodeURIComponent(v)}&output=embed`;
    }
  } catch {
    return null;
  }

  return null;
}

/** Normalise une URL réseau (ajoute https:// si besoin). */
export function normalizeSocialUrl(raw: string): string | null {
  const v = String(raw || "").trim();
  if (!v || v === "#") return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^\/\//.test(v)) return `https:${v}`;
  // Accepte facebook.com/... , www.instagram.com/... , etc.
  if (/^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(v)) {
    return `https://${v}`;
  }
  return null;
}

/** Uniquement les réseaux dont l’URL a été renseignée en admin. */
export function socialsFromSite(site: SiteInfo): SiteSocial[] {
  const urls = site.socialUrls ?? EMPTY_SITE.socialUrls;
  const map: Record<string, string | null> = {
    Facebook: normalizeSocialUrl(urls.facebook),
    TikTok: normalizeSocialUrl(urls.tiktok),
    YouTube: normalizeSocialUrl(urls.youtube),
    Instagram: normalizeSocialUrl(urls.instagram),
  };

  return SOCIAL_META.filter((s) => Boolean(map[s.label])).map((s) => ({
    ...s,
    href: map[s.label] as string,
  }));
}

export function waLink(text?: string, whatsapp?: string): string | null {
  const num = String(whatsapp || "").replace(/\D/g, "");
  if (!num) return null;
  const base = `https://wa.me/${num}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export async function getSite(): Promise<SiteInfo> {
  try {
    const settings = await api.getSettings();
    return siteFromSettings(settings);
  } catch {
    return EMPTY_SITE;
  }
}
