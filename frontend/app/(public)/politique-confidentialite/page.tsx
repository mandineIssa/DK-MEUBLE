import Link from "next/link";
import { api } from "@/lib/api";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: 'Politique de confidentialité',
  description:
    'Politique de confidentialité DK HOMETECH.',
  path: '/politique-confidentialite',
});

type Section = { title?: string; body?: string };

export default async function PolitiqueConfidentialitePage() {
  const page = await api.getPage("privacy").catch(() => ({ blocks: {} as Record<string, unknown> }));
  const b = page.blocks as {
    hero?: { eyebrow?: string; title?: string; subtitle?: string };
    intro?: string;
    sections?: Section[];
    updated_label?: string;
  };
  const hero = b.hero || {};
  const sections = Array.isArray(b.sections) ? b.sections : [];

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
        <p className="text-sm font-medium uppercase tracking-wider text-brand-orange">
          {hero.eyebrow || "Légal"}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-brand-black md:text-4xl">
          {hero.title || "Politique de confidentialité"}
        </h1>
        {hero.subtitle ? (
          <p className="mt-3 text-sm text-brand-black/60 md:text-base">{hero.subtitle}</p>
        ) : null}
        <span className="mt-3 block h-1 w-16 rounded-full bg-brand-orange" aria-hidden />

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-brand-black/75 md:text-base">
          {b.intro ? <p>{b.intro}</p> : null}

          {sections.map((section, i) => (
            <section key={`${section.title || "s"}-${i}`}>
              {section.title ? (
                <h2 className="text-lg font-bold text-brand-black">{section.title}</h2>
              ) : null}
              {section.body ? (
                <p className="mt-2 whitespace-pre-line">{section.body}</p>
              ) : null}
            </section>
          ))}

          <p className="text-xs text-brand-black/50">
            {b.updated_label || "Dernière mise à jour : septembre 2026"}
          </p>

          <p>
            <Link href="/contact" className="font-semibold text-brand-orange hover:underline">
              Nous contacter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
