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

/** Message prérempli depuis une fiche produit. L'envoi reste manuel dans WhatsApp. */
export function productWhatsAppMessage(product: WhatsAppProduct & { quantity?: number | null }, origin = ""): string {
  const name = clean(product.name) || "un produit";
  let intro = `Bonjour DK HOMETECH, je suis intéressé par ${name}`;
  const reference = clean(product.sku);
  if (reference) intro += `, référence ${reference}`;
  if (typeof product.price === "number" && Number.isFinite(product.price)) {
    intro += `, affiché à ${formatWhatsAppPrice(product.price)}`;
  }
  intro += ".";

  const lines = [intro, "Je voudrais connaître sa disponibilité, sa garantie et les conditions de livraison."];
  if (typeof product.quantity === "number" && product.quantity > 1) {
    lines.push(`Quantité souhaitée : ${product.quantity}.`);
  }
  const url = productPublicUrl(product.slug, origin);
  if (url) lines.push(url);

  return lines.join("\n");
}
