"use client";

import { useEffect, useState } from "react";

function formatRemaining(end: string) {
  const diff = new Date(end).getTime() - Date.now();
  if (!Number.isFinite(diff)) return "";
  if (diff <= 0) return "Terminée";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(days)}j ${pad(hours)}h ${pad(minutes)}m`;
}

export default function PromoCountdown({ end, plain = false }: { end: string; plain?: boolean }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!end) return;
    const tick = () => setLabel(formatRemaining(end));
    tick();
    const id = window.setInterval(tick, 30000);
    return () => window.clearInterval(id);
  }, [end]);

  if (!label) return null;

  return plain ? (
    <span className="font-bold text-brand-orange">{label}</span>
  ) : (
    <p className="mt-2 inline-flex rounded-lg bg-brand-orange/10 px-2 py-1 text-xs font-bold text-brand-orange">
      {label}
    </p>
  );
}
