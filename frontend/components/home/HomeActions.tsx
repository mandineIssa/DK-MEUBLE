import Link from "next/link";
import { api } from "@/lib/api";
import { homepageBlocks } from "@/lib/homepageBlocks";

export default async function HomeActions() {
  const settings = await api.getSettings().catch(() => null);
  const copy = homepageBlocks(settings);
  if (!copy.proTitle && copy.shortcuts.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-6">
      {copy.proTitle ? (
        <div className="grid gap-4 rounded-2xl border border-black/5 bg-white p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            {copy.proKicker ? (
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-orange">{copy.proKicker}</p>
            ) : null}
            <h2 className="mt-1 text-2xl font-extrabold text-brand-black">{copy.proTitle}</h2>
            {copy.proText ? <p className="mt-2 max-w-xl text-sm text-brand-black/70">{copy.proText}</p> : null}
          </div>
          {copy.proCta && copy.proHref ? (
            <Link href={copy.proHref} className="inline-flex rounded-full bg-brand-orange px-5 py-3 text-sm font-bold text-white">
              {copy.proCta}
            </Link>
          ) : null}
        </div>
      ) : null}

      {copy.shortcuts.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {copy.shortcuts.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="rounded-2xl bg-white px-4 py-4 text-sm font-bold text-brand-black shadow-sm hover:text-brand-orange"
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
