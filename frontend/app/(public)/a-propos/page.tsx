import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import { getSite, waLink } from "@/lib/site";

export const metadata = {
  title: "À propos — DK MEUBLE",
  description:
    "Depuis plus de 10 ans, DK MEUBLE équipe maisons, bureaux et institutions à Dakar et partout au Sénégal.",
};

type Blocks = Record<string, any>;

export default async function AboutPage() {
  const [page, site] = await Promise.all([
    api.getPage("about").catch(() => ({ blocks: {} as Blocks })),
    getSite(),
  ]);
  const b = page.blocks as Blocks;
  const hero = b.hero || {};
  const intro = b.intro || {};
  const experience = b.experience || {};
  const homeSection = b.home_section || {};
  const business = b.business_section || {};
  const delivery = b.delivery || {};
  const values = b.values || {};
  const reasons = b.reasons || {};
  const cta = b.cta || {};

  const whatsappHref = waLink(undefined, site.whatsapp);

  return (
    <div className="bg-[#ececec]">
      <section className="bg-brand-black text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
          <p className="text-sm font-medium uppercase tracking-wider text-brand-orange">
            {hero.eyebrow || "À propos de DK MEUBLE"}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">
            {hero.title || "Bienvenue chez DK MEUBLE"}
          </h1>
          {hero.subtitle && (
            <p className="mt-3 max-w-2xl text-lg text-white/80">{hero.subtitle}</p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 md:px-6 md:py-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="relative min-h-[280px] overflow-hidden rounded-2xl">
            <Image
              src={
                intro.image_url ||
                "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80"
              }
              alt="Showroom DK MEUBLE"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
          <div className="space-y-4 text-brand-black/80">
            {(intro.paragraphs || []).map((p: string, i: number) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-extrabold text-brand-black md:text-2xl">
            {experience.title}
          </h2>
          {(experience.paragraphs || []).map((p: string, i: number) => (
            <p key={i} className="mt-3 text-brand-black/75">
              {p}
            </p>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-extrabold text-brand-black">
              {homeSection.title}
            </h2>
            <p className="mt-2 text-brand-black/75">{homeSection.intro}</p>
            <p className="mt-4 text-sm font-semibold text-brand-black">
              {homeSection.list_label}
            </p>
            <ul className="mt-3 space-y-2 text-brand-black/80">
              {(homeSection.items || []).map((item: string) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-orange" />
                  {item}
                </li>
              ))}
            </ul>
            {homeSection.footer_note && (
              <p className="mt-5 text-sm text-brand-black/70">
                {homeSection.footer_note}{" "}
                <Link href="/contact" className="font-semibold text-brand-orange hover:underline">
                  Contact
                </Link>
              </p>
            )}
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-extrabold text-brand-black">
              {business.title}
            </h2>
            <p className="mt-2 text-brand-black/75">{business.intro}</p>
            <p className="mt-4 text-sm font-semibold text-brand-black">
              {business.list_label}
            </p>
            <ul className="mt-3 space-y-2 text-brand-black/80">
              {(business.items || []).map((item: string) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-orange" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href={business.cta_href || "/devis"}
              className="mt-6 inline-flex rounded-full bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-orange-dark"
            >
              {business.cta_label || "Demander un devis"}
            </Link>
          </section>
        </div>

        <section className="rounded-2xl bg-brand-black px-6 py-8 text-white md:px-10">
          <h2 className="text-xl font-extrabold md:text-2xl">{delivery.title}</h2>
          <p className="mt-3 max-w-3xl text-white/80">{delivery.text}</p>
          {delivery.highlight && (
            <p className="mt-4 font-semibold text-brand-orange">{delivery.highlight}</p>
          )}
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-brand-black md:text-2xl">
            {values.title}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(values.items || []).map((v: { title: string; text: string }) => (
              <div key={v.title} className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="font-extrabold text-brand-orange">{v.title}</p>
                <p className="mt-2 text-sm text-brand-black/75">{v.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-extrabold text-brand-black md:text-2xl">
            {reasons.title}
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {(reasons.items || []).map((r: { value: string; label: string }) => (
              <div
                key={r.label}
                className="rounded-2xl bg-white px-4 py-6 text-center shadow-sm"
              >
                <p className="text-lg font-extrabold text-brand-orange">{r.value}</p>
                <p className="mt-1 text-xs text-brand-black/65">{r.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 text-center shadow-sm md:p-10">
          <h2 className="text-xl font-extrabold text-brand-black md:text-2xl">
            {cta.title}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-black/75">{cta.text}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-full bg-whatsapp px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95"
              >
                Nous contacter sur WhatsApp
              </a>
            )}
            {site.phoneTel && (
              <a
                href={`tel:${site.phoneTel}`}
                className="inline-flex rounded-full bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-orange-dark"
              >
                Nous appeler
              </a>
            )}
            <Link
              href="/contact"
              className="inline-flex rounded-full border-2 border-brand-black px-5 py-2.5 text-sm font-semibold text-brand-black"
            >
              Formulaire de contact
            </Link>
          </div>
          <p className="mt-8 text-sm text-brand-black/50">
            {cta.tagline || "DK MEUBLE — Qualité · Choix · Confiance"}
            <br />
            {cta.partner_line || "Votre partenaire pour la maison et le bureau."}
            {site.address ? ` ${site.address}` : ""}
          </p>
        </section>
      </div>
    </div>
  );
}
