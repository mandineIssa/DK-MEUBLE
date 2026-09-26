import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import WhatsAppButton from "@/components/WhatsAppButton";
import VisitTracker from "@/components/VisitTracker";
import JsonLd from "@/components/seo/JsonLd";
import { SiteProvider } from "@/components/SiteProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CartProvider } from "@/components/CartProvider";
import { getSite } from "@/lib/site";
import { buildOrganizationSchema, buildWebSiteSchema } from "@/lib/seo";
import { Suspense } from "react";

/** ISR court : plus de LiveRefresh 15s qui rejouait tout le RSC. */
export const revalidate = 60;

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const site = await getSite();

  return (
    <SiteProvider site={site}>
      <ThemeProvider>
        <CartProvider>
          <JsonLd data={[buildOrganizationSchema(site), buildWebSiteSchema()]} />
          <Suspense fallback={null}>
            <VisitTracker />
          </Suspense>
          <div className="flex min-h-screen flex-col bg-[var(--content-bg-alt)] text-[var(--text-primary)]">
            <Header />
            <main className="flex flex-1 flex-col pb-20 md:pb-0">{children}</main>
            <Footer />
          </div>
          <BottomNav />
          <WhatsAppButton />
        </CartProvider>
      </ThemeProvider>
    </SiteProvider>
  );
}
