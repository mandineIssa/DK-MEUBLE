"use client";

import { useSite } from "@/components/SiteProvider";
import { formatSnPhone } from "@/lib/phone";

export default function CallButton() {
  const site = useSite();
  const raw = site.phones?.[0] || site.phoneDisplay || site.phoneTel || "";
  if (!raw) return null;
  const phone = formatSnPhone(raw);
  if (!phone.tel) return null;

  return (
    <a
      href={`tel:${phone.tel}`}
      className="fixed bottom-24 left-4 z-50 rounded-full bg-brand-orange px-4 py-3 text-xs font-bold text-white md:hidden"
    >
      Appeler
    </a>
  );
}
