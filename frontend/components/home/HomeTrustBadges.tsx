import Link from "next/link";
import type { ReactNode } from "react";
import type { HomepageItem } from "@/lib/api";

const icons: Record<string, ReactNode> = {
  truck: (
    <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7V10Z" />
  ),
  shield: <path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z" />,
  headset: (
    <>
      <path d="M4 12a8 8 0 0 1 16 0" />
      <path d="M4 12v4a2 2 0 0 0 2 2h2v-6H4Zm16 0v4a2 2 0 0 1-2 2h-2v-6h4Z" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
};

function TrustIcon({ name }: { name?: string | null }) {
  const path = icons[name || ""] || icons.shield;
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 text-brand-orange" fill="none" stroke="currentColor" strokeWidth="1.8">
      {path}
    </svg>
  );
}

export default function HomeTrustBadges({
  title,
  items,
}: {
  title?: string | null;
  items: HomepageItem[];
}) {
  if (!items.length) return null;

  return (
    <section className="border-y border-black/5 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        {title ? (
          <h2 className="mb-6 text-center text-lg font-bold text-brand-black md:text-xl">{title}</h2>
        ) : null}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => {
            const inner = (
              <div className="flex items-start gap-3">
                <TrustIcon name={item.icon} />
                <div>
                  <p className="font-bold text-brand-black">{item.title}</p>
                  {item.subtitle ? (
                    <p className="mt-0.5 text-sm text-brand-black/60">{item.subtitle}</p>
                  ) : null}
                </div>
              </div>
            );
            return item.link_url ? (
              <Link key={item.id} href={item.link_url} className="transition hover:opacity-80">
                {inner}
              </Link>
            ) : (
              <div key={item.id}>{inner}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
