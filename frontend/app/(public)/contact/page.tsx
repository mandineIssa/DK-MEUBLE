import Image from "next/image";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import { api } from "@/lib/api";
import { getSite, socialsFromSite, waLink } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contact — DK MEUBLE",
  description: "Contactez DK MEUBLE à Dakar — WhatsApp, téléphone, devis, adresse magasin.",
};

export default async function ContactPage() {
  const [site, page] = await Promise.all([
    getSite(),
    api.getPage("contact").catch(() => ({ blocks: {} as Record<string, unknown> })),
  ]);
  const hero = (page.blocks.hero || {}) as Record<string, string>;
  const socials = socialsFromSite(site);
  const whatsappHref = waLink(undefined, site.whatsapp);
  const phoneHref = site.phoneTel ? `tel:${site.phoneTel}` : null;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-black md:text-4xl">
            {hero.title || "Contactez-nous"}
          </h1>
          <span className="mt-2 block h-1 w-16 rounded-full bg-brand-orange" aria-hidden />
          {(hero.subtitle || "WhatsApp, téléphone, devis — on vous répond rapidement.") && (
            <p className="mt-3 max-w-xl text-sm text-brand-black/60 md:text-base">
              {hero.subtitle || "WhatsApp, téléphone, devis — on vous répond rapidement."}
            </p>
          )}
        </header>

        {/* Actions rapides — maquette */}
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-start gap-2 rounded-2xl bg-whatsapp p-5 text-white shadow-sm transition hover:brightness-105"
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden>
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.42-1.42a9.9 9.9 0 0 0 4.62 1.17h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2Zm5.58 13.54c-.24.68-1.4 1.24-1.94 1.32-.5.07-1.14.1-1.84-.12-.42-.13-.97-.32-1.67-.62-2.94-1.27-4.85-4.23-5-4.42-.14-.19-1.18-1.57-1.18-3 0-1.42.74-2.12 1-2.41.26-.29.57-.36.76-.36h.55c.18 0 .41-.05.64.49.24.56.82 2 .89 2.14.07.14.12.31.02.5-.1.19-.14.31-.28.48-.14.16-.3.37-.42.5-.14.14-.28.29-.12.56.16.28.7 1.15 1.5 1.86 1.03.92 1.9 1.2 2.17 1.34.27.14.43.12.59-.07.16-.19.68-.79.86-1.06.18-.27.36-.22.61-.13.24.1 1.56.74 1.83.87.27.14.45.2.52.31.07.12.07.66-.17 1.34Z" />
              </svg>
              <span className="text-lg font-extrabold leading-tight">WhatsApp</span>
              <span className="text-sm text-white/90">Écrire un message</span>
            </a>
          ) : (
            <div className="rounded-2xl bg-black/5 p-5 text-brand-black/45">
              <p className="text-lg font-extrabold">WhatsApp</p>
              <p className="mt-1 text-sm">À configurer dans l’admin</p>
            </div>
          )}

          {phoneHref ? (
            <a
              href={phoneHref}
              className="flex flex-col items-start gap-2 rounded-2xl bg-brand-orange p-5 text-white shadow-sm transition hover:brightness-105"
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M6.5 4.5h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15.5 15.5 0 0 1 4.5 6.5a2 2 0 0 1 2-2Z" />
              </svg>
              <span className="text-lg font-extrabold leading-tight">Appeler</span>
              <span className="text-sm text-white/90">Nous appeler</span>
            </a>
          ) : (
            <div className="rounded-2xl bg-black/5 p-5 text-brand-black/45">
              <p className="text-lg font-extrabold">Appeler</p>
              <p className="mt-1 text-sm">À configurer dans l’admin</p>
            </div>
          )}

          <Link
            href="/devis"
            className="flex flex-col items-start gap-2 rounded-2xl bg-[#2B7CFF] p-5 text-white shadow-sm transition hover:brightness-105"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M7 3h8l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
              <path d="M15 3v5h5M8 12h8M8 16h6" />
            </svg>
            <span className="text-lg font-extrabold leading-tight">Demande de devis</span>
            <span className="text-sm text-white/90">Remplir le formulaire</span>
          </Link>
        </div>

        {/* Coordonnées + carte */}
        <div className="mt-10 grid gap-8 md:grid-cols-2 md:items-start">
          <ul className="space-y-5">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-orange/15 text-brand-orange">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                  <path d="M12 2c-3.9 0-7 3-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-4-3.1-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" />
                </svg>
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-black/45">Adresse</p>
                <p className="font-semibold text-brand-black">
                  {site.address || "Dakar, Sénégal"}
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-orange/15 text-brand-orange">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M6.5 4.5h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15.5 15.5 0 0 1 4.5 6.5a2 2 0 0 1 2-2Z" />
                </svg>
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-black/45">Téléphone</p>
                {phoneHref ? (
                  <a href={phoneHref} className="font-semibold text-brand-black hover:text-brand-orange">
                    {site.phoneDisplay || site.phoneTel}
                  </a>
                ) : (
                  <p className="font-semibold text-brand-black/40">À renseigner</p>
                )}
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-orange/15 text-brand-orange">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 7 9-7" />
                </svg>
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-black/45">Email</p>
                {site.email ? (
                  <a href={`mailto:${site.email}`} className="font-semibold text-brand-black hover:text-brand-orange">
                    {site.email}
                  </a>
                ) : (
                  <p className="font-semibold text-brand-black/40">À renseigner</p>
                )}
              </div>
            </li>
            {site.hours && (
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-orange/15 text-brand-orange">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-black/45">Horaires</p>
                  <p className="font-semibold text-brand-black">{site.hours}</p>
                </div>
              </li>
            )}
          </ul>

          <div className="overflow-hidden rounded-2xl border border-black/5 bg-[#f3f3f3] shadow-sm">
            {site.mapsEmbed ? (
              <iframe
                title="Carte DK MEUBLE"
                src={site.mapsEmbed}
                className="aspect-square w-full border-0 md:aspect-[4/3]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              <div className="flex aspect-square flex-col items-center justify-center gap-3 p-6 text-center text-sm text-brand-black/55 md:aspect-[4/3]">
                <p>
                  Collez un lien <strong className="font-semibold text-brand-black/70">Google Maps</strong>
                  {" "}(Partager → Intégrer une carte), pas google.com.
                </p>
                <p className="text-xs text-brand-black/40">Admin → Paramètres → URL embed Google Maps</p>
                {site.address ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-sm font-semibold text-brand-orange underline-offset-2 hover:underline"
                  >
                    Ouvrir l’adresse sur Google Maps
                  </a>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Réseaux sociaux */}
        {socials.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-extrabold text-brand-black">Nos réseaux sociaux</h2>
            <div className="mt-5 flex flex-wrap gap-6">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 transition hover:opacity-90"
                >
                  <span
                    style={{ background: s.background }}
                    className="flex h-14 w-14 items-center justify-center rounded-full shadow-md"
                  >
                    <svg viewBox="0 0 24 24" className={`h-6 w-6 ${s.iconClass}`} aria-hidden>
                      <path d={s.path} />
                    </svg>
                  </span>
                  <span className="text-xs font-semibold text-brand-black">{s.label}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Formulaire */}
        <section className="mt-12 rounded-2xl border border-black/5 bg-[#f7f7f7] p-6 md:p-8">
          <h2 className="text-lg font-extrabold text-brand-black">Formulaire de contact</h2>
          <p className="mt-1 text-sm text-brand-black/60">
            Laissez-nous un message — nous vous répondons rapidement.
          </p>
          <div className="mt-5">
            <ContactForm />
          </div>
        </section>

        {/* Bandeau magasin — image claire complète */}
        <section className="mt-12 overflow-hidden rounded-2xl shadow-md ring-1 ring-black/5">
          <div className="relative aspect-[16/7] w-full md:aspect-[21/8]">
            <Image
              src="/images/magasin-dk-meuble-banner.png"
              alt="Magasin DK MEUBLE — Venez nous rendre visite à Dakar"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 1024px"
              priority
            />
          </div>
        </section>
      </div>
    </div>
  );
}
