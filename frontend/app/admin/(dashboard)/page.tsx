"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { adminApi, type VisitsStats } from "@/lib/adminApi";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ products: 0, quotes: 0, messages: 0, visits: 0 });
  const [visits, setVisits] = useState<VisitsStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getDashboardStats().catch(() => ({
        products: 0,
        products_published: 0,
        quotes_new: 0,
        messages_new: 0,
      })),
      adminApi.getVisitsStats("12m").catch(() => null),
    ]).then(([dash, visitStats]) => {
      setVisits(visitStats);
      setStats({
        products: dash.products,
        quotes: dash.quotes_new,
        messages: dash.messages_new,
        visits: visitStats?.summary.this_month ?? visitStats?.summary.pageviews ?? 0,
      });
      setLoading(false);
    });
  }, []);

  const series = useMemo(() => {
    const monthly = visits?.monthly || [];
    if (monthly.length) return monthly.map((m) => ({ m: m.label, v: m.views }));
    return [
      { m: "Jan", v: 0 },
      { m: "Fév", v: 0 },
      { m: "Mar", v: 0 },
      { m: "Avr", v: 0 },
      { m: "Mai", v: 0 },
      { m: "Juin", v: 0 },
    ];
  }, [visits]);

  const maxV = Math.max(1, ...series.map((d) => d.v));
  const points = series
    .map((d, i) => {
      const x = series.length === 1 ? 50 : (i / (series.length - 1)) * 100;
      const y = 100 - (d.v / maxV) * 85 - 5;
      return `${x},${y}`;
    })
    .join(" ");

  const cards = [
    { label: "Produits", value: stats.products, href: "/admin/produits", color: "bg-brand-orange" },
    { label: "Devis (nouveaux)", value: stats.quotes, href: "/admin/devis", color: "bg-whatsapp" },
    { label: "Messages (nouveaux)", value: stats.messages, href: "/admin/messages", color: "bg-[#2B7CFF]" },
    { label: "Visites (ce mois)", value: stats.visits, href: "/admin/visites", color: "bg-[#7C3AED]" },
  ];

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-brand-black">Tableau de bord</h1>
      <p className="mt-1 text-sm text-brand-black/60">Vue d&apos;ensemble de l&apos;activité DK MEUBLE</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`${c.color} rounded-2xl p-5 text-white shadow-sm transition hover:opacity-95`}
          >
            <p className="text-sm font-medium text-white/85">{c.label}</p>
            <p className="mt-2 text-3xl font-extrabold">{loading ? "…" : c.value.toLocaleString("fr-FR")}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-bold text-brand-black">Évolution des visites</h2>
              <p className="mt-1 text-xs text-brand-black/50">12 derniers mois — données réelles</p>
            </div>
            <Link href="/admin/visites" className="text-xs font-bold text-brand-orange hover:underline">
              Voir le détail →
            </Link>
          </div>
          <div className="mt-4">
            <svg viewBox="0 0 100 100" className="h-48 w-full" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="#FF7A00"
                strokeWidth="2"
                points={points}
                vectorEffect="non-scaling-stroke"
              />
              <polyline
                fill="rgba(255,122,0,0.12)"
                stroke="none"
                points={`0,100 ${points} 100,100`}
              />
            </svg>
            <div className="mt-1 flex justify-between text-[10px] text-brand-black/40">
              {series.map((d) => (
                <span key={d.m}>{d.m}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-bold text-brand-black">Actions rapides</h2>
          <div className="mt-4 grid gap-3">
            <Link
              href="/admin/produits"
              className="flex items-center gap-3 rounded-xl bg-brand-orange/10 px-4 py-3 text-sm font-semibold text-brand-orange hover:bg-brand-orange/20"
            >
              <span className="text-lg">＋</span> Ajouter un produit
            </Link>
            <Link
              href="/admin/devis"
              className="flex items-center gap-3 rounded-xl bg-whatsapp/10 px-4 py-3 text-sm font-semibold text-whatsapp hover:bg-whatsapp/20"
            >
              <span className="text-lg">📋</span> Voir les devis
            </Link>
            <Link
              href="/admin/messages"
              className="flex items-center gap-3 rounded-xl bg-[#2B7CFF]/10 px-4 py-3 text-sm font-semibold text-[#2B7CFF] hover:bg-[#2B7CFF]/20"
            >
              <span className="text-lg">✉️</span> Lire les messages
            </Link>
            <Link
              href="/admin/visites"
              className="flex items-center gap-3 rounded-xl bg-[#7C3AED]/10 px-4 py-3 text-sm font-semibold text-[#7C3AED] hover:bg-[#7C3AED]/20"
            >
              <span className="text-lg">📈</span> Statistiques visites
            </Link>
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-3 rounded-xl bg-brand-black/5 px-4 py-3 text-sm font-semibold text-brand-black hover:bg-brand-black/10"
            >
              <span className="text-lg">↗</span> Voir le site public
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
