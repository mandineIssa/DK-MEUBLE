"use client";

import { useSite } from "@/components/SiteProvider";
import { formatSnPhones } from "@/lib/phone";

export default function TopBar() {
  const site = useSite();
  if (!site.topbarEnabled) return null;

  const items = [site.topbarText1, site.topbarText2].filter(Boolean);
  const raw = site.topbarPhone || site.phones.join("\n") || site.phoneDisplay || site.phoneTel || "";
  const bannerPhones = site.topbarShowPhone ? formatSnPhones(raw) : [];
  if (!items.length && bannerPhones.length === 0) return null;

  const parts = [
    ...items.map((text) => ({ key: text, node: <span>{text}</span> })),
    ...bannerPhones.map((phone, index) => ({
      key: phone.tel,
      node: (
        <a href={`tel:${phone.tel}`} className="whitespace-nowrap text-brand-orange hover:underline">
          {index === 0 && site.topbarPhoneLabel ? `${site.topbarPhoneLabel} : ` : ""}
          {phone.display}
        </a>
      ),
    })),
  ];

  return (
    <div className="bg-brand-black text-white">
      <p className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-xs font-semibold md:text-sm">
        {parts.map((part, index) => (
          <span key={`${part.key}-${index}`} className="contents">
            {index > 0 ? (
              <span className="hidden text-white/40 sm:inline" aria-hidden>
                •
              </span>
            ) : null}
            {part.node}
          </span>
        ))}
      </p>
    </div>
  );
}
