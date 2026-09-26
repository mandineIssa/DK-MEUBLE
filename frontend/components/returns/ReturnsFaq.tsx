"use client";

import { useState } from "react";

export type FaqItem = { q: string; a: string };

export default function ReturnsFaq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  if (!items.length) return null;

  return (
    <div className="divide-y rounded-2xl border bg-[var(--body-bg)]" style={{ borderColor: "var(--border-light)" }}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <span className="text-sm font-bold md:text-base" style={{ color: "var(--text-primary)" }}>
                {item.q}
              </span>
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ background: "var(--accent-primary)" }}
                aria-hidden
              >
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen ? (
              <div
                className="px-5 pb-5 text-sm leading-relaxed md:text-base"
                style={{ color: "var(--text-secondary)" }}
              >
                {item.a}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
