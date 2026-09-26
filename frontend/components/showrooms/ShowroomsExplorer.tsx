"use client";

import { useMemo, useState } from "react";
import type { Showroom } from "@/lib/api";

function mapsEmbedUrl(s: Showroom): string | null {
  if (s.latitude != null && s.longitude != null) {
    return `https://www.google.com/maps?q=${s.latitude},${s.longitude}&z=15&output=embed`;
  }
  const q = [s.address, s.city].filter(Boolean).join(", ");
  if (!q) return null;
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
}

function mapsLink(s: Showroom): string | null {
  if (s.latitude != null && s.longitude != null) {
    return `https://www.google.com/maps?q=${s.latitude},${s.longitude}`;
  }
  const q = [s.address, s.city].filter(Boolean).join(", ");
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
}

export default function ShowroomsExplorer({ showrooms }: { showrooms: Showroom[] }) {
  const [activeId, setActiveId] = useState(showrooms[0]?.id ?? null);
  const active = useMemo(
    () => showrooms.find((s) => s.id === activeId) || showrooms[0] || null,
    [showrooms, activeId]
  );
  const embed = active ? mapsEmbedUrl(active) : null;
  const link = active ? mapsLink(active) : null;

  if (!showrooms.length) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-stretch">
      {/* Liste */}
      <ul className="flex flex-col gap-3">
        {showrooms.map((s) => {
          const selected = active?.id === s.id;
          const tel = s.phone ? s.phone.replace(/\s/g, "") : null;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setActiveId(s.id)}
                className="w-full rounded-2xl border p-5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]"
                style={{
                  borderColor: selected ? "var(--accent-primary)" : "var(--border-light)",
                  background: "var(--body-bg)",
                  boxShadow: selected ? "0 0 0 1px var(--accent-primary)" : undefined,
                }}
                aria-pressed={selected}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p
                      className="text-[11px] font-bold uppercase tracking-wide"
                      style={{ color: "var(--accent-primary)" }}
                    >
                      {s.city || "Showroom"}
                    </p>
                    <h2
                      className="mt-1 text-lg font-extrabold md:text-xl"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {s.name}
                    </h2>
                  </div>
                  {selected ? (
                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase text-white"
                      style={{ background: "var(--accent-primary)" }}
                    >
                      Sélectionné
                    </span>
                  ) : null}
                </div>

                <ul className="mt-4 space-y-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {s.address ? (
                    <li className="flex gap-2.5">
                      <span
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                        style={{ background: "color-mix(in srgb, var(--accent-primary) 15%, transparent)", color: "var(--accent-primary)" }}
                        aria-hidden
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                          <path d="M12 2c-3.9 0-7 3-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-4-3.1-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" />
                        </svg>
                      </span>
                      <span>
                        {s.address}
                        {s.city ? (
                          <>
                            <br />
                            <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                              {s.city}
                            </span>
                          </>
                        ) : null}
                      </span>
                    </li>
                  ) : null}
                  {s.phone ? (
                    <li className="flex gap-2.5">
                      <span
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                        style={{ background: "color-mix(in srgb, var(--accent-primary) 15%, transparent)", color: "var(--accent-primary)" }}
                        aria-hidden
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6.5 4.5h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15.5 15.5 0 0 1 4.5 6.5a2 2 0 0 1 2-2Z" />
                        </svg>
                      </span>
                      <a
                        href={`tel:${tel}`}
                        className="font-semibold hover:underline"
                        style={{ color: "var(--text-primary)" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {s.phone}
                      </a>
                    </li>
                  ) : null}
                  {s.opening_hours ? (
                    <li className="flex gap-2.5">
                      <span
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                        style={{ background: "color-mix(in srgb, var(--accent-primary) 15%, transparent)", color: "var(--accent-primary)" }}
                        aria-hidden
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 2" />
                        </svg>
                      </span>
                      <span className="whitespace-pre-line">{s.opening_hours}</span>
                    </li>
                  ) : null}
                </ul>

                <div className="mt-4 flex flex-wrap gap-2">
                  {tel ? (
                    <a
                      href={`tel:${tel}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold text-white"
                      style={{ background: "var(--accent-primary)" }}
                    >
                      Appeler
                    </a>
                  ) : null}
                  {mapsLink(s) ? (
                    <a
                      href={mapsLink(s)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold"
                      style={{ borderColor: "var(--border-light)", color: "var(--text-primary)" }}
                    >
                      Itinéraire
                    </a>
                  ) : null}
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Carte */}
      <div
        className="overflow-hidden rounded-2xl border bg-[var(--body-bg)] shadow-sm lg:min-h-[420px]"
        style={{ borderColor: "var(--border-light)" }}
      >
        {embed ? (
          <div className="relative h-full min-h-[280px] lg:min-h-[420px]">
            <iframe
              title={`Carte — ${active?.name || "Showroom"}`}
              src={embed}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            {link && active ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 right-4 rounded-full px-4 py-2 text-xs font-bold text-white shadow-md"
                style={{ background: "var(--accent-primary)" }}
              >
                Ouvrir dans Google Maps
              </a>
            ) : null}
          </div>
        ) : (
          <div
            className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 px-6 text-center lg:min-h-[420px]"
            style={{ color: "var(--text-secondary)" }}
          >
            <svg viewBox="0 0 24 24" className="h-10 w-10 opacity-40" fill="currentColor" aria-hidden>
              <path d="M12 2c-3.9 0-7 3-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-4-3.1-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" />
            </svg>
            <p className="text-sm font-semibold">Carte non disponible</p>
            <p className="text-xs">Ajoutez latitude / longitude ou une adresse complète en admin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
