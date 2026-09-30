import ProductLink from "@/components/ProductLink";
import { api } from "@/lib/api";

function stars(rating: number) {
  const value = Math.max(0, Math.min(5, Math.round(rating)));
  return `${"★".repeat(value)}${"☆".repeat(5 - value)}`;
}

export default async function HomeReviews() {
  const data = await api.getRecentReviews().catch(() => null);
  const reviews = (data?.reviews || []).filter((review) => review.body?.trim() && review.author_name?.trim());
  if (!reviews.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <h2 className="text-2xl font-extrabold text-brand-black">Avis clients</h2>
      <p className="mt-1 text-sm text-brand-black/70">Avis publiés après modération.</p>
      <ul className="mt-4 grid gap-4 md:grid-cols-3">
        {reviews.map((review) => (
          <li key={review.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-brand-orange" aria-label={`${review.rating} sur 5`}>
              {stars(review.rating)}
            </p>
            <p className="mt-2 text-sm font-semibold text-brand-black">{review.author_name}</p>
            {review.title ? <p className="mt-2 font-bold text-brand-black">{review.title}</p> : null}
            <p className="mt-2 text-sm text-brand-black/80">{review.body}</p>
            {review.product_slug && review.product_name ? (
              <ProductLink
                href={`/produits/${review.product_slug}`}
                label={review.product_name}
                className="mt-3 text-sm font-semibold text-brand-orange"
              >
                {review.product_name}
              </ProductLink>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
