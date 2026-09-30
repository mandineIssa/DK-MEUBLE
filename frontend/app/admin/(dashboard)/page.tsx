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

  const cards = [
    { label: "Produits au catalogue", value: stats.products, href: "/admin/produits", hint: "Fiches créées, publiées ou non" },
    { label: "Devis en attente", value: stats.quotes, href: "/admin/devis", hint: "Demandes pas encore traitées" },
    { label: "Messages non lus", value: stats.messages, href: "/admin/messages", hint: "Écrits depuis la page Contact" },
    { label: "Visites ce mois", value: stats.visits, href: "/admin/visites", hint: "Pages vues depuis le 1er du mois" },
  ];

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-brand-black">Tableau de bord</h1>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-brand-black/60">
        Ce qui demande une action : nouveaux devis, messages non lus, taille du catalogue et visites du mois.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-brand-orange">{c.label}</p>
            <p className="mt-2 text-3xl font-extrabold tabular-nums text-brand-black">{loading ? "…" : c.value.toLocaleString("fr-FR")}</p>
            <p className="mt-2 text-sm text-brand-black/55">{c.hint}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-bold text-brand-black">Visites des 12 derniers mois</h2>
              <p className="mt-1 text-xs text-brand-black/50">Nombre de pages vues. Le détail et la provenance sont dans Visites.</p>
            </div>
            <Link href="/admin/visites" className="text-xs font-bold text-brand-orange hover:underline">
              Voir le détail →
            </Link>
          </div>
          <ul className="mt-4 space-y-2">
            {series.map((d) => (
              <li key={d.m} className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3">
                <span className="text-xs font-semibold text-brand-black/70">{d.m}</span>
                <div className="h-2 overflow-hidden rounded-full bg-brand-black/5">
                  <div className="h-full rounded-full bg-brand-orange" style={{ width: `${Math.max(d.v > 0 ? 4 : 0, (d.v / maxV) * 100)}%` }} />
                </div>
                <span className="text-xs tabular-nums text-brand-black/50">{d.v.toLocaleString("fr-FR")}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-bold text-brand-black">Aller plus loin</h2>
          <p className="mt-1 text-xs text-brand-black/50">Les tâches les plus fréquentes.</p>
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
              <span className="text-lg">📈</span> Voir qui visite le site
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
