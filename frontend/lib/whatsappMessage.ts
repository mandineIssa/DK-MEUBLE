/** Message du bouton WhatsApp hors fiche produit. */
export const WHATSAPP_GENERAL_MESSAGE = [
  "Bonjour DK HOMETECH 👋",
  "",
  "Je souhaite avoir des informations sur vos produits (meubles, électroménager et mobilier de bureau).",
  "",
  "Pouvez-vous m'aider ?",
  "",
  "Merci.",
].join("\n");

export type WhatsAppProduct = {
  name: string;
  sku?: string | null;
  price?: number | null;
  slug?: string | null;
};

function clean(value: unknown): string {
  if (value == null) return "";
  const text = String(value).trim();
  if (!text || text === "undefined" || text === "null") return "";
  return text;
}

export function productPublicUrl(slug: string | null | undefined, origin: string): string {
  const safeSlug = clean(slug);
  const base = clean(origin).replace(/\/$/, "");
  if (!safeSlug || !base) return "";
  return `${base}/produits/${encodeURIComponent(safeSlug)}`;
}

export function formatWhatsAppPrice(price: number): string {
  return `${price.toLocaleString("fr-FR")} FCFA`;
}

/** Message prérempli depuis une fiche produit. Les champs absents sont omis. */
export function productWhatsAppMessage(product: WhatsAppProduct, origin = ""): string {
  const name = clean(product.name);
  const lines = [
    "Bonjour DK HOMETECH 👋",
    "",
    "Je suis intéressé par le produit suivant :",
    "",
    `🛍️ Produit : ${name || "ce produit"}`,
  ];

  const reference = clean(product.sku);
  if (reference) lines.push(`🔖 Référence : ${reference}`);

  if (typeof product.price === "number" && Number.isFinite(product.price)) {
    lines.push(`💰 Prix : ${formatWhatsAppPrice(product.price)}`);
  }

  lines.push("", "Est-il disponible ?", "Pouvez-vous m'indiquer les conditions de livraison ?");

  const url = productPublicUrl(product.slug, origin);
  if (url) lines.push("", `🔗 ${url}`);

  lines.push("", "Merci.");
  return lines.join("\n");
}
