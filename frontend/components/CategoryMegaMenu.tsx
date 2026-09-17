"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, type NavigationPayload, type NavigationSection } from "@/lib/api";

export default function CategoryMegaMenu({
  variant = "button",
}: {
  variant?: "button" | "nav";
}) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NavigationPayload | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    api
      .getNavigation()
      .then((res) => {
        setData(res);
        const firstWithPanel = res.sections.find((s) => s.has_panel);
        setActiveId(firstWithPanel?.id ?? res.sections[0]?.id ?? null);
      })
      .catch(() => setData(null));
  }, []);

  const sections = data?.sections || [];
  const columns = Math.min(6, Math.max(2, data?.settings?.columns ?? 4));
  const active = useMemo(
    () => sections.find((s) => s.id === activeId) || sections.find((s) => s.has_panel) || sections[0] || null,
    [sections, activeId]
  );

  function close() {
    setOpen(false);
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          variant === "nav"
            ? "flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-white hover:text-brand-orange xl:text-xs"
            : "flex items-center gap-1.5 rounded-full bg-brand-orange px-3 py-1.5 text-xs font-bold text-white"
        }
        aria-expanded={open}
      >
        {variant === "nav" ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        ) : null}
        Les catégories
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-50 mt-0 w-[min(96vw,920px)] overflow-hidden rounded-b-xl border border-black/5 bg-white text-left shadow-2xl">
          {sections.length === 0 ? (
            <p className="p-6 text-sm text-brand-black/50">Aucune entrée de menu configurée.</p>
          ) : (
            <div className="flex min-h-[280px] max-h-[70vh]">
              {/* Sidebar sections */}
              <aside className="w-[240px] shrink-0 overflow-y-auto border-r border-black/5 bg-[#fafafa]">
                <ul>
                  {sections.map((section) => (
                    <SectionRow
                      key={section.id}
                      section={section}
                      active={active?.id === section.id}
                      onHover={() => setActiveId(section.id)}
                      onNavigate={close}
                    />
                  ))}
                </ul>
              </aside>

              {/* Items grid */}
              <div className="min-w-0 flex-1 overflow-y-auto p-5">
                {active?.has_panel ? (
                  <>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-extrabold uppercase tracking-wide text-brand-black">
                        {active.label}
                      </h3>
                      {active.href ? (
                        <Link
                          href={active.href}
                          onClick={close}
                          className="text-xs font-semibold text-brand-orange hover:underline"
                        >
                          Tout voir →
                        </Link>
                      ) : null}
                    </div>
                    <div
                      className="grid gap-x-8 gap-y-6"
                      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                    >
                      {active.items.map((item) => {
                        const isBlock = Boolean(item.children?.length);
                        return (
                          <div key={item.id} className={isBlock ? "min-w-0" : undefined}>
                            {item.href ? (
                              <Link
                                href={item.href}
                                onClick={close}
                                className={
                                  isBlock
                                    ? "mb-2 block text-[11px] font-extrabold uppercase tracking-wide text-brand-black hover:text-brand-orange"
                                    : "block py-1.5 text-sm text-brand-black/75 transition hover:text-brand-orange"
                                }
                              >
                                {item.label}
                              </Link>
                            ) : (
                              <span
                                className={
                                  isBlock
                                    ? "mb-2 block text-[11px] font-extrabold uppercase tracking-wide text-brand-black"
                                    : "block py-1.5 text-sm text-brand-black/40"
                                }
                              >
                                {item.label}
                              </span>
                            )}
                            {isBlock ? (
                              <ul className="space-y-1.5">
                                {item.children!.map((child) => (
                                  <li key={child.id}>
                                    {child.href ? (
                                      <Link
                                        href={child.href}
                                        onClick={close}
                                        className="text-sm text-brand-black/70 hover:text-brand-orange"
                                      >
                                        {child.label}
                                      </Link>
                                    ) : (
                                      <span className="text-sm text-brand-black/35">{child.label}</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : active ? (
                  <div className="flex h-full flex-col items-start justify-center gap-3">
                    <p className="text-sm text-brand-black/60">
                      Lien direct vers <strong>{active.label}</strong>
                    </p>
                    {active.href ? (
                      <Link
                        href={active.href}
                        onClick={close}
                        className="rounded-full bg-brand-orange px-5 py-2 text-sm font-bold text-white"
                      >
                        Ouvrir {active.label}
                      </Link>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-brand-black/50">Survolez une catégorie à gauche.</p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SectionRow({
  section,
  active,
  onHover,
  onNavigate,
}: {
  section: NavigationSection;
  active: boolean;
  onHover: () => void;
  onNavigate: () => void;
}) {
  const content = (
    <>
      <span className="truncate">{section.label}</span>
      {section.has_panel ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m9 6 6 6-6 6" />
        </svg>
      ) : null}
    </>
  );

  const className = `flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-[12px] font-bold uppercase tracking-wide transition ${
    active ? "bg-white text-brand-orange" : "text-brand-black/75 hover:bg-white hover:text-brand-orange"
  }`;

  if (section.has_panel) {
    return (
      <li onMouseEnter={onHover}>
        {section.href ? (
          <Link href={section.href} onClick={onNavigate} className={className}>
            {content}
          </Link>
        ) : (
          <button type="button" className={className} onMouseEnter={onHover}>
            {content}
          </button>
        )}
      </li>
    );
  }

  return (
    <li onMouseEnter={onHover}>
      {section.href ? (
        <Link href={section.href} onClick={onNavigate} className={className}>
          {content}
        </Link>
      ) : (
        <span className={className}>{content}</span>
      )}
    </li>
  );
}
