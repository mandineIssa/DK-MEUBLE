import { permanentRedirect } from "next/navigation";

/** Alias historique : /promo → /promotions (301) */
export default function PromoRedirectPage({
  searchParams,
}: {
  searchParams: { category?: string; sort?: string; page?: string };
}) {
  const p = new URLSearchParams();
  if (searchParams.category) p.set("category", searchParams.category);
  if (searchParams.sort) p.set("sort", searchParams.sort);
  if (searchParams.page) p.set("page", searchParams.page);
  const qs = p.toString();
  permanentRedirect(`/promotions${qs ? `?${qs}` : ""}`);
}
