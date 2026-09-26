"use client";

import Link from "next/link";
import Image from "next/image";
import { CSSProperties, FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import SiteBrand from "@/components/SiteBrand";

type FooterPayload = Awaited<ReturnType<typeof api.getFooter>>;

const SOCIAL_ICONS: Record<string, { path: string; bg: string }> = {
  facebook: {
    bg: "#1877F2",
    path: "M14 8h2.5V5.5H14c-1.7 0-2.5 1-2.5 2.6V10H9v2.8h2.5V19H14v-6.2h2.2L17 10h-3V8.2c0-.5.2-.7.7-.7z",
  },
  instagram: {
    bg: "#E4405F",
    path: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 4.5A4.5 4.5 0 1 0 16.5 12 4.5 4.5 0 0 0 12 7.5zm5.2-.9a1.1 1.1 0 1 0 1.1 1.1 1.1 1.1 0 0 0-1.1-1.1zM12 9.2A2.8 2.8 0 1 1 9.2 12 2.8 2.8 0 0 1 12 9.2z",
  },
  tiktok: {
    bg: "#010101",
    path: "M16.5 4c.6 1.7 1.9 3 3.5 3.5V10c-1.5-.1-2.9-.6-4-1.5v6.3A5.8 5.8 0 1 1 10 9.1v2.2a3.6 3.6 0 1 0 2.5 3.4V4h4z",
  },
  youtube: {
    bg: "#FF0000",
    path: "M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C17.9 5 12 5 12 5s-5.9 0-7.7.3A2.7 2.7 0 0 0 2.4 7.2 28 28 0 0 0 2 12a28 28 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9C6.1 19 12 19 12 19s5.9 0 7.7-.3a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-4.8zM10 15.2V8.8L15.5 12 10 15.2z",
  },
  x: {
    bg: "#111",
    path: "M4 4h4.2l4 5.5L16.8 4H20l-6.1 7.2L20.5 20H16.3l-4.4-6L7.2 20H4l6.5-7.7L4 4z",
  },
  whatsapp: {
    bg: "#25D366",
    path: "M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.42-1.42a9.9 9.9 0 0 0 4.62 1.17h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2Z",
  },
};

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
  const phones = String(s?.company_phones || "")
    .split(/[,;|\n]/)
    .map((p) => p.trim())
    .filter(Boolean);

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
                  <li>
                    <span style={{ color: "var(--footer-text-muted)" }}>Téléphone : </span>
                    {phones.map((p, i) => (
                      <span key={p}>
                        {i > 0 ? ", " : ""}
                        <a
                          href={`tel:${p.replace(/\D/g, "")}`}
                          className="hover:text-[var(--footer-link-hover)]"
                        >
                          {p}
                        </a>
                      </span>
                    ))}
                  </li>
                ) : null}
              </ul>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">
                {s?.socials_heading || "Retrouvez-nous sur"}
              </h3>
              <div className="flex flex-wrap gap-2">
                {socials.map((soc) => {
                  const icon = SOCIAL_ICONS[soc.platform] || SOCIAL_ICONS.facebook;
                  return (
                    <a
                      key={`${soc.platform}-${soc.id}`}
                      href={soc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={soc.platform}
                      style={{ background: icon.bg }}
                      className="flex h-9 w-9 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--footer-accent)]"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
                        <path d={icon.path} />
                      </svg>
                    </a>
                  );
                })}
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
                      <div key={p.id} className="relative h-8 w-14">
                        <Image
                          src={p.logo_url}
                          alt={p.name}
                          fill
                          className="object-contain"
                          sizes="56px"
                        />
                      </div>
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
