import type { Metadata } from "next";
import HomeHeroSlider from "@/components/home/HomeHeroSlider";
import HomeTrustBadges from "@/components/home/HomeTrustBadges";
import HomeCategoryGrid from "@/components/home/HomeCategoryGrid";
import HomeProductCarousel from "@/components/home/HomeProductCarousel";
import HomeBrands from "@/components/home/HomeBrands";
import HomeActions from "@/components/home/HomeActions";
import HomeVisit from "@/components/home/HomeVisit";
import HomeOffers from "@/components/home/HomeOffers";
import HomeSearchBar from "@/components/HomeSearchBar";
import HomeEquip from "@/components/home/HomeEquip";
import HomeForYou from "@/components/home/HomeForYou";
import HomeReviews from "@/components/home/HomeReviews";
import { api, type HomepageSection } from "@/lib/api";
import { buildPageMetadata, SITE_NAME } from "@/lib/seo";

function isPromoCarousel(section: HomepageSection) {
  return /promo|offre/i.test(section.title || "");
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await api.getSettings().catch(() => null);
  const title =
    settings?.seo?.title?.trim() ||
    `${SITE_NAME} | Meubles, mobilier de bureau et électroménager au Sénégal`;
  const description =
    settings?.seo?.description?.trim() ||
    "Meubles, armoires, mobilier de bureau et électroménager à Dakar. Conseil, devis et livraison partout au Sénégal — DK HOMETECH.";

  return buildPageMetadata({
    title,
    description,
    path: "/",
    image: settings?.brand?.logo_url || undefined,
  });
}

export default async function HomePage() {
  const [homepage, settings, promotions] = await Promise.all([
    api.getHomepage().catch(() => null),
    api.getSettings().catch(() => null),
    api.getPromotions({ per_page: "4", sort: "ending" }).catch(() => null),
  ]);
  const offerPromos = promotions?.data || [];
  const sections = homepage?.sections || [];
  const useAlt = settings?.theme?.use_alt_bg_sections !== false;
  const heroes = sections.filter((section) => section.type === "hero");
  const categories = sections.filter((section) => section.type === "category_grid");
  const trust = sections.filter((section) => section.type === "trust_badges");
  const brands = sections.filter((section) => section.type === "brands");
  const carousels = sections.filter(
    (section) => section.type === "product_carousel" && !isPromoCarousel(section)
  );

  const seenProductIds = new Set<number>();
  for (const promo of offerPromos) {
    const id = promo.product?.id ?? promo.product_id;
    if (id) seenProductIds.add(id);
  }
  const uniqueCarousels = carousels
    .map((section) => {
      const products = (section.products || []).filter((product) => {
        if (seenProductIds.has(product.id)) return false;
        seenProductIds.add(product.id);
        return true;
      });
      return { section, products };
    })
    .filter(({ section, products }) => products.length > 0 || Boolean(section.banner_image));

  let altIndex = 0;
  const band = () => {
    if (!useAlt) return "";
    return altIndex++ % 2 === 0 ? "bg-[var(--content-bg-alt)]" : "bg-[var(--body-bg)]";
  };

  return (
    <div className="bg-[var(--content-bg-alt)]">
      {heroes.map((section) => (
        <HomeHeroSlider key={section.id} slides={section.slides || []} meta={section.meta} />
      ))}

      <HomeSearchBar />

      {categories.map((section) => (
        <div key={section.id} className={band()}>
          <HomeCategoryGrid title={section.title} items={section.items || []} />
        </div>
      ))}

      {trust.map((section) => (
        <div key={section.id} className={band()}>
          <HomeTrustBadges title={section.title} items={section.items || []} />
        </div>
      ))}

      <HomeOffers promos={offerPromos} settings={settings} />

      {uniqueCarousels.map(({ section, products }) => (
        <div key={section.id} className={band()}>
          <HomeProductCarousel
            title={section.title}
            bannerImage={section.banner_image}
            bannerLink={section.banner_link}
            products={products}
          />
        </div>
      ))}

      {brands.map((section) => (
        <div key={section.id} className={band()}>
          <HomeBrands title={section.title} brands={section.brands || []} />
        </div>
      ))}

      <HomeForYou />
      <HomeEquip />
      <HomeVisit excludeProductIds={[...seenProductIds]} showReasons={trust.every((section) => !(section.items || []).length)} />
      <HomeActions />
      <HomeReviews />
    </div>
  );
}
