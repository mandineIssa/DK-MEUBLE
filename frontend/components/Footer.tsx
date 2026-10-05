"use client";

import Link from "next/link";
import { CSSProperties, FormEvent, useEffect, useState } from "react";
import { api, imageUrl } from "@/lib/api";
import { formatSnPhones } from "@/lib/phone";
import SiteBrand from "@/components/SiteBrand";

type FooterPayload = Awaited<ReturnType<typeof api.getFooter>>;

function SocialGlyph({ platform }: { platform: string }) {
  const cls = "h-7 w-7";
  if (platform === "instagram") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
        <circle cx="12" cy="12" r="4.1" />
        <circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (platform === "tiktok") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
        <path d="M14.2 3.2c.5 2.6 2 4.5 4.3 5.1v2.8a7.2 7.2 0 0 1-4.1-1.3v6.6a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v2.9a2.8 2.8 0 1 0 1.9 2.7V3.2h2.7Z" />
      </svg>
    );
  }
  if (platform === "x" || platform === "twitter") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
        <path d="M14.7 10.4 21.8 2.2h-1.7l-6.1 7.1L9 2.2H2.4l7.5 10.9L2.4 21.8h1.7l6.6-7.6 5.3 7.6h6.6l-8-11.4Zm-2.3 2.7-.8-1.1L5 3.7h2.6l4.9 7 .8 1.1 6.3 9h-2.6l-5.2-7.4Z" />
      </svg>
    );
  }
  if (platform === "youtube") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
        <path d="M22 12.2s0-3.2-.4-4.6a2.9 2.9 0 0 0-2-2C17.9 5.2 12 5.2 12 5.2s-5.9 0-7.6.4a2.9 2.9 0 0 0-2 2C2 9 2 12.2 2 12.2s0 3.2.4 4.6a2.9 2.9 0 0 0 2 2c1.7.4 7.6.4 7.6.4s5.9 0 7.6-.4a2.9 2.9 0 0 0 2-2c.4-1.4.4-4.6.4-4.6ZM10.1 15.4V9l5.2 3.2-5.2 3.2Z" />
      </svg>
    );
  }
  if (platform === "whatsapp") {
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
        <path d="M12 3.2A8.7 8.7 0 0 0 4.6 16.3L3.4 20.8l4.6-1.2A8.7 8.7 0 1 0 12 3.2Zm4.9 12.3c-.2.6-1.2 1.1-1.7 1.1-.4.1-.9.2-2.9-.6-2.4-1-4-3.5-4.1-3.6-.1-.2-1-1.3-1-2.5s.6-1.8.9-2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .5.4.2.6.7 2 .7 2.1.1.2 0 .3-.1.5l-.4.5c-.1.2-.3.3-.1.6.2.3.7 1.2 1.6 1.9 1.1.9 2 1.1 2.3 1.3.2.1.4.1.6-.1l.7-.8c.2-.2.3-.2.6-.1.2.1 1.5.7 1.8.8.2.1.4.2.4.3.1.3 0 .8-.2 1.4Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden>
      <path d="M14.5 8.2h-2V6.8c0-.5.3-.6.6-.6H15V4h-2.2C10.4 4 9.8 5.8 9.8 7v1.2H8v2.4h1.8V20h2.7v-9.4h2.1l.2-2.4Z" />
    </svg>
  );
}

function themeStyle(theme?: FooterPayload["settings"]["theme"]): CSSProperties {
  if (!theme) return {};
  // --footer-accent hérite de --accent-primary (thème global) — pas de surcharge ici
  const map: Record<string, string | undefined> = {
    "--footer-bg-primary": theme.bg_primary,
    "--footer-bg-secondary": theme.bg_secondary,
    "--footer-text-primary": theme.text_primary,
    "--footer-text-secondary": theme.text_secondary,
    "--footer-text-muted": theme.text_muted,
    "--footer-link-hover": theme.link_hover,
    "--footer-divider": theme.divider,
  };
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(map)) {
    if (v) out[k] = v;
  }
  return out as CSSProperties;
}

export default function Footer() {
  const [data, setData] = useState<FooterPayload | null>(null);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [openCol, setOpenCol] = useState<number | null>(null);
  const year = new Date().getFullYear();

  useEffect(() => {
    api.getFooter().then(setData).catch(() => setData(null));
  }, []);

  async function onNewsletter(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    if (!consent) {
      setErr("Veuillez accepter la politique de confidentialité.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.subscribeNewsletter(email);
      setMsg(res.message || "Merci, vous êtes inscrit !");
      setEmail("");
      setConsent(false);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const s = data?.settings;
  const columns = data?.columns || [];
  const socials = data?.socials || [];
  const payments = data?.payments || [];
  const brands = data?.brands || [];
  const colCount = Math.min(5, Math.max(3, s?.columns_count || 4));
  const phones = formatSnPhones(String(s?.company_phones || ""));

  const style = themeStyle(s?.theme);

  return (
    <footer
      className="text-[var(--footer-text-primary)]"
      style={{ ...style, background: "var(--footer-bg-secondary)" }}
    >
      {/* 1. Newsletter + App — fond le plus sombre */}
      {s?.show_newsletter !== false ? (
        <div
          className="border-b"
          style={{
            background: "var(--footer-bg-primary)",
            borderColor: "var(--footer-divider)",
          }}
        >
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1fr_1.6fr] md:items-start md:px-6 lg:grid-cols-[160px_minmax(0,1fr)_240px]">
            <div className="hidden lg:flex lg:items-start lg:pt-1">
              <SiteBrand variant="dark" />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-extrabold uppercase tracking-wide md:text-lg">
                {s?.newsletter_title || "Nouveau sur notre boutique ?"}
              </h2>

              <p
                className="mt-3 text-sm leading-relaxed"
                style={{ color: "var(--footer-text-secondary)" }}
              >
                {s?.newsletter_text ||
                  "Abonnez-vous à notre newsletter pour recevoir des mises à jour sur nos dernières offres. Vous pouvez vous désabonner à tout moment, comme décrit dans la "}
                <Link
                  href={s?.newsletter_privacy_url || "/politique-confidentialite"}
                  className="underline-offset-2 hover:underline"
                  style={{ color: "var(--footer-link-hover)" }}
                >
                  {s?.newsletter_privacy_link_label || "Politique de confidentialité"}
                </Link>
                .
              </p>

              <p
                className="mt-3 text-sm leading-relaxed"
                style={{ color: "var(--footer-text-secondary)" }}
              >
                {s?.newsletter_legal_intro ||
                  "Pour vous abonner à notre newsletter, vous devez d'abord lire et accepter les conditions légales"}{" "}
                <Link
                  href={s?.newsletter_legal_url || s?.newsletter_privacy_url || "/cgu"}
                  className="font-semibold hover:underline"
                  style={{ color: "var(--footer-accent)" }}
                >
                  {s?.newsletter_legal_link_label || "J'accepte les conditions légales"}
                </Link>
              </p>

              <form onSubmit={onNewsletter} className="mt-4 space-y-4">
                <label
                  className="flex items-start gap-3 text-sm leading-snug"
                  style={{ color: "var(--footer-text-secondary)" }}
                >
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 rounded-sm border bg-transparent"
                    style={{ accentColor: "var(--footer-accent)", borderColor: "var(--footer-text-muted)" }}
                    required
                  />
                  <span>
                    {s?.newsletter_privacy_label ||
                      "J'accepte la Politique de confidentialité et des cookies et je comprends que je peux me désabonner des newsletters à tout moment."}
                  </span>
                </label>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <div className="relative flex-1">
                    <span
                      className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-black/35"
                      aria-hidden
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="m3 7 9 6 9-6" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Entrez votre adresse e-mail"
                      className="w-full rounded-sm border-0 py-3 pl-11 pr-4 text-sm text-black outline-none placeholder:text-black/40"
                      aria-label="Adresse e-mail newsletter"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="shrink-0 rounded-sm border px-6 py-3 text-sm font-bold transition disabled:opacity-60"
                    style={{
                      borderColor: "var(--footer-text-primary)",
                      background: "var(--footer-bg-primary)",
                      color: "var(--footer-text-primary)",
                    }}
                  >
                    {s?.newsletter_cta || "S'abonner"}
                  </button>
                </div>

                {msg ? <p className="text-sm text-green-300">{msg}</p> : null}
                {err ? <p className="text-sm text-red-300">{err}</p> : null}

                <p className="text-sm" style={{ color: "var(--footer-text-muted)" }}>
                  {s?.newsletter_disclaimer ||
                    "Vous pouvez vous désabonner à tout moment comme décrit dans la "}
                  <Link
                    href={s?.newsletter_privacy_url || "/politique-confidentialite"}
                    className="underline-offset-2 hover:underline"
                    style={{ color: "var(--footer-accent)" }}
                  >
                    {s?.newsletter_privacy_link_label || "Politique de confidentialité"}
                  </Link>
                  .
                </p>
              </form>
            </div>

            {s?.show_app_block ? (
              <div className="max-w-xs lg:pt-1">
                <p className="text-sm font-extrabold uppercase tracking-wide">
                  {s.app_block_title || "Dans votre poche"}
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--footer-text-muted)" }}>
                  {s.app_block_subtitle}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {s.app_store_url ? (
                    <a
                      href={s.app_store_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition hover:opacity-90"
                      style={{ borderColor: "var(--footer-divider)", color: "var(--footer-text-primary)" }}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                        <path d="M18.7 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9-.7 0-1.9-.8-3.1-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.1 1.7 2.4 2.9 2.4 1.2 0 1.6-.7 3-.7s1.7.7 3 .7 2-1.1 2.8-2.2c.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.3-.9-2.3-3.4zM15.5 5.5c.6-.8 1.1-1.8.9-2.9-1 .1-2.1.7-2.8 1.5-.6.7-1.1 1.8-.9 2.8 1.1.1 2.1-.5 2.8-1.4z" />
                      </svg>
                      App Store
                    </a>
                  ) : null}
                  {s.google_play_url ? (
                    <a
                      href={s.google_play_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition hover:opacity-90"
                      style={{ borderColor: "var(--footer-divider)", color: "var(--footer-text-primary)" }}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                        <path d="M3.6 2.3c-.3.3-.5.8-.5 1.4v16.6c0 .6.2 1.1.5 1.4l.1.1 9.3-9.3v-.2L3.7 2.2l-.1.1zm12.1 6.9L12.4 7l-8.2 8.2 8.2 8.2 3.3-2.2 3.9-2.2c1.1-.6 1.1-2.4 0-3.1l-3.9-2.2z" />
                      </svg>
                      Google Play
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* 2–5. Zone continue fond secondaire */}
      <div style={{ background: "var(--footer-bg-secondary)" }}>
        {/* Colonnes de liens */}
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
          <div
            className="hidden gap-8 md:grid"
            style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
          >
            {columns.map((col) => (
              <div key={col.id}>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">
                  {col.title}
                </h3>
                <ul className="space-y-2 text-sm" style={{ color: "var(--footer-text-secondary)" }}>
                  {col.links.map((l) => (
                    <li key={l.id}>
                      <Link
                        href={l.url}
                        target={l.opens_new_tab ? "_blank" : undefined}
                        rel={l.opens_new_tab ? "noopener noreferrer" : undefined}
                        className="transition-colors hover:text-[var(--footer-link-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--footer-accent)]"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Mobile accordion */}
          <div className="space-y-0 md:hidden">
            {columns.map((col) => {
              const open = openCol === col.id;
              return (
                <div
                  key={col.id}
                  className="border-b"
                  style={{ borderColor: "var(--footer-divider)" }}
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-3 text-left text-sm font-bold uppercase tracking-wide"
                    aria-expanded={open}
                    onClick={() => setOpenCol(open ? null : col.id)}
                  >
                    {col.title}
                    <span aria-hidden>{open ? "−" : "+"}</span>
                  </button>
                  {open ? (
                    <ul
                      className="space-y-2 pb-3 text-sm"
                      style={{ color: "var(--footer-text-secondary)" }}
                    >
                      {col.links.map((l) => (
                        <li key={l.id}>
                          <Link
                            href={l.url}
                            target={l.opens_new_tab ? "_blank" : undefined}
                            rel={l.opens_new_tab ? "noopener noreferrer" : undefined}
                            className="hover:text-[var(--footer-link-hover)]"
                          >
                            {l.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact + Social + Paiement */}
        <div className="border-t" style={{ borderColor: "var(--footer-divider)" }}>
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:grid-cols-2 md:px-6 lg:grid-cols-3">
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">
                {s?.contact_heading || "Contactez-nous"}
              </h3>
              <ul className="space-y-1.5 text-sm" style={{ color: "var(--footer-text-secondary)" }}>
                {s?.company_name ? (
                  <li>
                    <span style={{ color: "var(--footer-text-muted)" }}>Entreprise : </span>
                    {s.company_name}
                  </li>
                ) : null}
                {s?.company_address ? (
                  <li>
                    <span style={{ color: "var(--footer-text-muted)" }}>Adresse : </span>
                    {s.company_address}
                  </li>
                ) : null}
                {phones.length > 0 ? (
                  <li className="flex items-start gap-1">
                    <span className="shrink-0" style={{ color: "var(--footer-text-muted)" }}>
                      Téléphone :
                    </span>
                    <span className="flex flex-col">
                      {phones.map((formatted) => (
                        <a
                          key={formatted.tel}
                          href={`tel:${formatted.tel}`}
                          className="block whitespace-nowrap hover:text-[var(--footer-link-hover)]"
                        >
                          {formatted.display}
                        </a>
                      ))}
                    </span>
                  </li>
                ) : null}
              </ul>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">
                {s?.socials_heading || "Retrouvez-nous sur"}
              </h3>
              <div className="flex flex-wrap items-center gap-6">
                {socials.map((soc) => (
                  <a
                    key={`${soc.platform}-${soc.id}`}
                    href={soc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={soc.platform}
                    className="text-white transition hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--footer-accent)]"
                  >
                    <SocialGlyph platform={soc.platform} />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">
                {s?.payments_heading || "Modes de paiement"}
              </h3>
              {payments.length > 0 ? (
                <div className="flex flex-wrap items-center gap-4">
                  {payments.map((p) =>
                    p.logo_url ? (
                      <img
                        key={p.id}
                        src={imageUrl(p.logo_url)}
                        alt={p.name}
                        className="h-8 w-auto max-w-[4.5rem] object-contain"
                      />
                    ) : (
                      <span key={p.id} className="text-xs" style={{ color: "var(--footer-text-muted)" }}>
                        {p.name}
                      </span>
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm" style={{ color: "var(--footer-text-muted)" }}>
                  {s?.payments_empty_text || "Wave, Orange Money, cash…"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Marques */}
        {brands.length > 0 ? (
          <div className="border-t" style={{ borderColor: "var(--footer-divider)" }}>
            <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide">
                {s?.brands_heading || "Nos marques"}
              </h3>
              <ul
                className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7"
                style={{ color: "var(--footer-text-secondary)" }}
              >
                {brands.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={b.href}
                      className="hover:text-[var(--footer-link-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--footer-accent)]"
                    >
                      {b.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {/* Copyright */}
        <div className="border-t" style={{ borderColor: "var(--footer-divider)" }}>
          <div
            className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs md:flex-row md:px-6"
            style={{ color: "var(--footer-text-muted)" }}
          >
            <p>
              © {year} {s?.brand_name || s?.company_name || "DK HOMETECH"}.{" "}
              {s?.copyright_text || "Tous droits réservés."}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
