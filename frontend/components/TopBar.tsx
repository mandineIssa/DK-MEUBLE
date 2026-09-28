"use client";

import { useSite } from "@/components/SiteProvider";
import { formatSnPhone } from "@/lib/phone";

export default function TopBar() {
  const site = useSite();
  if (!site.topbarEnabled) return null;

  const items = [site.topbarText1, site.topbarText2].filter(Boolean);
  const raw = site.topbarPhone || site.phones?.[0] || site.phoneDisplay || site.phoneTel || "";
  const phone = site.topbarShowPhone && raw ? formatSnPhone(raw) : null;
  if (!items.length && !phone?.display) return null;

  const parts = [
    ...items.map((text) => ({ key: text, node: <span>{text}</span> })),
    ...(phone?.display
      ? [
          {
            key: "phone",
            node: (
              <a href={`tel:${phone.tel}`} className="text-brand-orange hover:underline">
                {site.topbarPhoneLabel ? `${site.topbarPhoneLabel} : ` : ""}
                {phone.display}
              </a>
            ),
          },
        ]
      : []),
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
