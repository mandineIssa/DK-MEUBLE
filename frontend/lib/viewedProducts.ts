const VIEWED_KEY = "dk_viewed_slugs";
const VISITOR_KEY = "dk_vid";

export function rememberViewed(slug: string) {
  if (!slug || typeof window === "undefined") return;
  try {
    const current = readViewed();
    const next = [slug, ...current.filter((item) => item !== slug)].slice(0, 12);
    localStorage.setItem(VIEWED_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function readViewed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(VIEWED_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter((item): item is string => typeof item === "string" && item.length > 0).slice(0, 12);
  } catch {
    return [];
  }
}

export function visitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(VISITOR_KEY) || "";
  } catch {
    return "";
  }
}
