import type { Metadata } from "next";
import HomeHeroSlider from "@/components/home/HomeHeroSlider";
import HomeTrustBadges from "@/components/home/HomeTrustBadges";
import HomeCategoryGrid from "@/components/home/HomeCategoryGrid";
import HomeProductCarousel from "@/components/home/HomeProductCarousel";
import HomeBrands from "@/components/home/HomeBrands";
import { api } from "@/lib/api";
import { buildPageMetadata, SITE_NAME } from "@/lib/seo";

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
  const homepage = await api.getHomepage().catch(() => null);
  const sections = homepage?.sections || [];
  const settings = await api.getSettings().catch(() => null);
  const useAlt = settings?.theme?.use_alt_bg_sections !== false;

  let altIndex = 0;

  return (
    <div className="bg-[var(--content-bg-alt)]">
      {sections.map((section) => {
        // Alternance blanc / gris clair pour rythmer la page (désactivable en admin)
        const useAltBg =
          useAlt &&
          (section.type === "product_carousel" ||
            section.type === "category_grid" ||
            section.type === "brands" ||
            section.type === "trust_badges");
        const bgClass = useAltBg
          ? altIndex++ % 2 === 0
            ? "bg-[var(--content-bg-alt)]"
            : "bg-[var(--body-bg)]"
          : "";

        switch (section.type) {
          case "hero":
            return <HomeHeroSlider key={section.id} slides={section.slides || []} />;
          case "trust_badges":
            return (
              <div key={section.id} className={bgClass}>
                <HomeTrustBadges title={section.title} items={section.items || []} />
              </div>
            );
          case "category_grid":
            return (
              <div key={section.id} className={bgClass}>
                <HomeCategoryGrid title={section.title} items={section.items || []} />
              </div>
            );
          case "product_carousel":
            return (
              <div key={section.id} className={bgClass}>
                <HomeProductCarousel
                  title={section.title}
                  bannerImage={section.banner_image}
                  bannerLink={section.banner_link}
                  products={section.products || []}
                />
              </div>
            );
          case "brands":
            return (
              <div key={section.id} className={bgClass}>
                <HomeBrands title={section.title} brands={section.brands || []} />
              </div>
            );
          // newsletter + socials : gérés uniquement dans le Footer (évite le doublon)
          case "newsletter":
          case "socials":
            return null;
          default:
            return null;
        }
      })}
    </div>
  );
}
