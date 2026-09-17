import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import WhatsAppButton from "@/components/WhatsAppButton";
import VisitTracker from "@/components/VisitTracker";
import { SiteProvider } from "@/components/SiteProvider";
import { CartProvider } from "@/components/CartProvider";
import { getSite } from "@/lib/site";
import { Suspense } from "react";

/** ISR court : plus de LiveRefresh 15s qui rejouait tout le RSC. */
export const revalidate = 60;

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const site = await getSite();

  return (
    <SiteProvider site={site}>
      <CartProvider>
        <Suspense fallback={null}>
          <VisitTracker />
        </Suspense>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex flex-1 flex-col pb-20 md:pb-0">{children}</main>
          <Footer />
        </div>
        <BottomNav />
        <WhatsAppButton />
      </CartProvider>
    </SiteProvider>
  );
}
