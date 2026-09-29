"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CompareItem = { id: number; slug: string; name: string };

const KEY = "dk_compare_v1";
const MAX = 3;

type Ctx = {
  items: CompareItem[];
  has: (id: number) => boolean;
  toggle: (item: CompareItem) => void;
  remove: (id: number) => void;
  clear: () => void;
};

const CompareContext = createContext<Ctx | null>(null);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, ready]);

  const value = useMemo<Ctx>(
    () => ({
      items,
      has: (id) => items.some((i) => i.id === id),
      toggle: (item) => {
        setItems((prev) => {
          if (prev.some((i) => i.id === item.id)) return prev.filter((i) => i.id !== item.id);
          if (prev.length >= MAX) return [...prev.slice(1), item];
          return [...prev, item];
        });
      },
      remove: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
      clear: () => setItems([]),
    }),
    [items]
  );

  return (
    <CompareContext.Provider value={value}>
      {children}
      {items.length > 0 ? (
        <a
          href="/comparer"
          className="fixed left-1/2 z-[55] -translate-x-1/2 rounded-full bg-brand-black px-4 py-2 text-xs font-bold text-white shadow-md bottom-[calc(12.25rem+env(safe-area-inset-bottom,0px)+var(--vv-bottom,0px))] md:bottom-6 md:left-4 md:translate-x-0"
        >
          Comparer ({items.length})
        </a>
      ) : null}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare hors CompareProvider");
  return ctx;
}
