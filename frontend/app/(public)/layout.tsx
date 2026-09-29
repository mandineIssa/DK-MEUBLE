import Header from "@/components/Header";
import TopBar from "@/components/TopBar";
import CallButton from "@/components/CallButton";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import WhatsAppButton from "@/components/WhatsAppButton";
import PromoPopupLoader from "@/components/PromoPopup";
import VisualViewportPin from "@/components/VisualViewportPin";
import VisitTracker from "@/components/VisitTracker";
import JsonLd from "@/components/seo/JsonLd";
import { SiteProvider } from "@/components/SiteProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CartProvider } from "@/components/CartProvider";
import { CompareProvider } from "@/components/CompareProvider";
import { getSite } from "@/lib/site";
import { buildOrganizationSchema, buildWebSiteSchema } from "@/lib/seo";
import { Suspense } from "react";

/** ISR : pages publiques rafraîchies toutes les 2 min (plus rapide en prod). */
export const revalidate = 120;

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const site = await getSite();

  return (
    <SiteProvider site={site}>
      <ThemeProvider>
        <CartProvider>
        <CompareProvider>
          <JsonLd data={[buildOrganizationSchema(site), buildWebSiteSchema()]} />
          <Suspense fallback={null}>
            <VisitTracker />
          </Suspense>
          <div className="flex min-h-screen flex-col bg-[var(--content-bg-alt)] text-[var(--text-primary)]">
            <TopBar />
            <Header />
            <main className="flex flex-1 flex-col pb-20 md:pb-0">{children}</main>
            <Footer />
          </div>
          <VisualViewportPin />
          <BottomNav />
          <PromoPopupLoader />
          <WhatsAppButton />
          <CallButton />
        </CompareProvider>
        </CartProvider>
      </ThemeProvider>
    </SiteProvider>
  );
}
