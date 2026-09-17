import HomeHeroSlider from "@/components/home/HomeHeroSlider";
import HomeTrustBadges from "@/components/home/HomeTrustBadges";
import HomeCategoryGrid from "@/components/home/HomeCategoryGrid";
import HomeProductCarousel from "@/components/home/HomeProductCarousel";
import HomeBrands from "@/components/home/HomeBrands";
import { api } from "@/lib/api";

export default async function HomePage() {
  const homepage = await api.getHomepage().catch(() => null);
  const sections = homepage?.sections || [];

  return (
    <div className="bg-[#ececec]">
      {sections.map((section) => {
        switch (section.type) {
          case "hero":
            return <HomeHeroSlider key={section.id} slides={section.slides || []} />;
          case "trust_badges":
            return (
              <HomeTrustBadges key={section.id} title={section.title} items={section.items || []} />
            );
          case "category_grid":
            return (
              <HomeCategoryGrid key={section.id} title={section.title} items={section.items || []} />
            );
          case "product_carousel":
            return (
              <HomeProductCarousel
                key={section.id}
                title={section.title}
                bannerImage={section.banner_image}
                bannerLink={section.banner_link}
                products={section.products || []}
              />
            );
          case "brands":
            return <HomeBrands key={section.id} title={section.title} brands={section.brands || []} />;
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
