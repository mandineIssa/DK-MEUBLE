"use client";

import { useWaLink } from "@/components/SiteProvider";

export default function PromoWaButton({
  productName,
  pricePromo,
}: {
  productName: string;
  pricePromo: number;
}) {
  const href = useWaLink(
    `Bonjour, je suis intéressé(e) par la promo « ${productName} » à ${pricePromo.toLocaleString("fr-FR")} FCFA.`
  );

  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-brand-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-orange"
    >
      WhatsApp
    </a>
  );
}
