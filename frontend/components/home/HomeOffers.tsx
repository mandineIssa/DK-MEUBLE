import Link from "next/link";
import { imageUrl, type Promotion, type SiteSettings } from "@/lib/api";
import { homepageBlocks } from "@/lib/homepageBlocks";
import PromoCountdown from "@/components/PromoCountdown";
import ProductLink from "@/components/ProductLink";

export default function HomeOffers({
  promos = [],
  settings = null,
}: {
  promos?: Promotion[];
  settings?: SiteSettings | null;
}) {
  const copy = homepageBlocks(settings);
  if (!promos.length) return null;

  const soonest = promos
    .map((promo) => new Date(promo.end_date).getTime())
    .filter((time) => Number.isFinite(time) && time > Date.now())
    .sort((a, b) => a - b)[0];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          {copy.offersTitle ? (
            <h2 className="text-2xl font-extrabold text-brand-black md:text-3xl">{copy.offersTitle}</h2>
          ) : null}
          {soonest ? (
            <p className="mt-1 text-sm text-brand-black/70">
              Se termine dans <PromoCountdown end={new Date(soonest).toISOString()} plain />
            </p>
          ) : null}
        </div>
        {copy.offersLinkLabel ? (
          <Link href="/promotions" className="text-sm font-bold text-brand-orange">
            {copy.offersLinkLabel}
          </Link>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {promos.map((promo) => {
          const product = promo.product;
          const image = product?.images?.[0]?.path;
          return (
            <ProductLink
              key={promo.id}
              href={product?.slug ? `/produits/${product.slug}` : "/promotions"}
              label={product?.name || "Produit"}
              className="overflow-hidden rounded-2xl bg-white shadow-sm"
            >
              <div className="relative aspect-[4/3] bg-[#f5f5f5]">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl(image)} alt={product?.name || "Offre"} className="h-full w-full object-cover" />
                ) : null}
                <span className="absolute left-3 top-3 rounded-md bg-red-600 px-2 py-1 text-xs font-bold text-white">
                  {promo.discount_label || `-${Math.round(promo.discount_percent)} %`}
                </span>
              </div>
              <div className="p-4">
                <p className="line-clamp-2 text-sm font-bold text-brand-black">{product?.name || "Produit"}</p>
                <p className="mt-2 text-lg font-extrabold text-brand-orange">
                  {promo.price_promo.toLocaleString("fr-FR")} FCFA
                </p>
                <p className="text-sm text-brand-black/40 line-through">
                  {promo.price_original.toLocaleString("fr-FR")} FCFA
                </p>
              </div>
            </ProductLink>
          );
        })}
      </div>
    </section>
  );
}
