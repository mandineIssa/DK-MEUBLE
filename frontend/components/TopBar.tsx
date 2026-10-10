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

  const delivery = site.topbarText1 || "Livraison partout au Sénégal";

  return (
    <>
      <div className="relative flex h-11 items-center overflow-hidden bg-[#1B4F9A] text-white md:hidden" role="note">
        <div aria-hidden className="absolute -top-3 -bottom-3 -left-[8%] w-[42%] bg-[#E10600] [transform:skewX(-24deg)]" />
        <div aria-hidden className="absolute -top-4 -bottom-4 left-[31%] w-2.5 bg-white [transform:skewX(-24deg)]" />
        <svg viewBox="0 0 32 16" className="absolute left-3 top-1/2 z-10 h-5 w-9 -translate-y-1/2" fill="currentColor" aria-hidden>
          <path d="M1 3.2h13.2V11H1V3.2Zm14.2 2.2h5.2l4.4 3.1V11h-2.1a2.3 2.3 0 0 0-4.4 0h-3.1V5.4Zm-9.6 8.1a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6Zm12.2 0a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6Z" />
        </svg>
        <p className="absolute inset-y-0 left-[34%] right-11 z-10 flex items-center justify-center whitespace-nowrap text-center text-[11px] font-extrabold leading-none tracking-tight min-[400px]:text-[13px]">
          {delivery}
        </p>
        <span className="absolute right-3 top-1/2 z-10 flex h-[18px] w-8 -translate-y-1/2 overflow-hidden" aria-label="Drapeau du Sénégal">
          <span className="flex-1 bg-[#00853F]" />
          <span className="flex flex-1 items-center justify-center bg-[#FDEF42] text-[9px] leading-none text-[#00853F]">★</span>
          <span className="flex-1 bg-[#E31B23]" />
        </span>
      </div>
      <div className="hidden bg-brand-black text-white md:block">
      <p className="mx-auto flex max-w-7xl flex-nowrap items-center justify-start gap-x-3 overflow-x-auto px-4 py-1.5 text-xs font-semibold whitespace-nowrap sm:justify-center sm:py-2 md:text-sm">
        {parts.map((part, index) => (
          <span key={`${part.key}-${index}`} className="contents">
            {index > 0 ? (
              <span className="text-white/40" aria-hidden>
                •
              </span>
            ) : null}
            {part.node}
          </span>
        ))}
      </p>
      </div>
    </>
  );
}
