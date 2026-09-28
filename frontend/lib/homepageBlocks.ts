import type { SiteSettings } from "@/lib/api";

export type HomepageBlocks = {
  offersTitle: string;
  offersLinkLabel: string;
  furnitureKicker: string;
  furnitureTitle: string;
  furnitureText: string;
  furnitureCta: string;
  latestTitle: string;
  reasonsTitle: string;
  reasons: string[];
  servicesTitle: string;
  visitTitle: string;
  visitText: string;
  aboutTitle: string;
  aboutText: string;
  aboutLinkLabel: string;
  contactTitle: string;
  contactWriteLabel: string;
  contactShowroomsLabel: string;
  contactMapLabel: string;
  proKicker: string;
  proTitle: string;
  proText: string;
  proCta: string;
  proHref: string;
  shortcuts: Array<{ label: string; href: string }>;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function homepageBlocks(settings: SiteSettings | null): HomepageBlocks {
  const raw = settings?.homepage?.blocks || {};
  const reasons = text(raw.reasons_text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const shortcuts = text(raw.shortcuts_text)
    .split("\n")
    .map((line) => {
      const [label, href] = line.split("|");
      return { label: (label || "").trim(), href: (href || "").trim() };
    })
    .filter((item) => item.label && item.href);

  return {
    offersTitle: text(raw.offers_title),
    offersLinkLabel: text(raw.offers_link_label),
    furnitureKicker: text(raw.furniture_kicker),
    furnitureTitle: text(raw.furniture_title),
    furnitureText: text(raw.furniture_text),
    furnitureCta: text(raw.furniture_cta),
    latestTitle: text(raw.latest_title),
    reasonsTitle: text(raw.reasons_title),
    reasons,
    servicesTitle: text(raw.services_title),
    visitTitle: text(raw.visit_title),
    visitText: text(raw.visit_text),
    aboutTitle: text(raw.about_title),
    aboutText: text(raw.about_text),
    aboutLinkLabel: text(raw.about_link_label),
    contactTitle: text(raw.contact_title),
    contactWriteLabel: text(raw.contact_write_label),
    contactShowroomsLabel: text(raw.contact_showrooms_label),
    contactMapLabel: text(raw.contact_map_label),
    proKicker: text(raw.pro_kicker),
    proTitle: text(raw.pro_title),
    proText: text(raw.pro_text),
    proCta: text(raw.pro_cta),
    proHref: text(raw.pro_href),
    shortcuts,
  };
}
