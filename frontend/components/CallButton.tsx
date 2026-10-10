"use client";

import { usePathname } from "next/navigation";
import { useSite } from "@/components/SiteProvider";
import { formatSnPhone } from "@/lib/phone";

export default function CallButton() {
  const pathname = usePathname();
  const site = useSite();
  if (pathname.startsWith("/panier") || pathname.startsWith("/commande")) return null;
  const onProduct = /^\/produits\/[^/]+/.test(pathname);
  const raw = site.phones?.[0] || site.phoneDisplay || site.phoneTel || "";
  if (!raw) return null;
  const phone = formatSnPhone(raw);
  if (!phone.tel) return null;

  return (
    <a
      href={`tel:${phone.tel}`}
      className={`fixed left-4 z-[60] rounded-full bg-brand-orange px-4 py-3 text-xs font-bold text-white shadow-md md:hidden ${
        onProduct
          ? "bottom-[calc(12.5rem+env(safe-area-inset-bottom,0px)+var(--vv-bottom,0px))]"
          : "bottom-[calc(8.25rem+env(safe-area-inset-bottom,0px)+var(--vv-bottom,0px))]"
      }`}
    >
      Appeler
    </a>
  );
}
