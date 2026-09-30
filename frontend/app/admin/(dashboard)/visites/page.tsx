"use client";

import { useEffect, useMemo, useState } from "react";
import { adminApi, type VisitsStats } from "@/lib/adminApi";

const PERIODS = [
  { id: "7d", label: "7 jours" },
  { id: "30d", label: "30 jours" },
  { id: "90d", label: "90 jours" },
  { id: "12m", label: "12 mois" },
] as const;

type SourceRow = { key: string; label: string; views: number; pct: number };

function formatDelta(today: number, yesterday: number) {
  if (yesterday <= 0) {
    return today > 0 ? "Premières visites aujourd’hui" : "Aucune visite hier non plus";
  }
  const pct = Math.round(((today - yesterday) / yesterday) * 100);
  if (pct === 0) return "Stable par rapport à hier";
  return pct > 0 ? `+${pct} % par rapport à hier` : `${pct} % par rapport à hier`;
}

function Meter({
  items,
  empty,
}: {
  items: Array<{ label: string; value: number; hint?: string }>;
  empty: string;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  if (items.length === 0) {
    return <p className="text-sm text-brand-black/45">{empty}</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-semibold text-brand-black">{item.label}</span>
            <span className="shrink-0 tabular-nums text-xs text-brand-black/55">
              {item.value.toLocaleString("fr-FR")}
              {item.hint ? ` · ${item.hint}` : ""}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-brand-black/5">
            <div
              className="h-full rounded-full bg-brand-orange"
              style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function SourceList({ items }: { items: SourceRow[] }) {
  return (
    <Meter
      empty="Aucune provenance enregistrée."
      items={items.map((item) => ({
        label: item.label,
        value: item.views,
        hint: `${item.pct} %`,
      }))}
    />
  );
}

export default function AdminVisitesPage() {
  const [period, setPeriod] = useState<string>("7d");
  const [data, setData] = useState<VisitsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminApi
      .getVisitsStats(period)
      .then((stats) => {
        if (!cancelled) {
          setData(stats);
          setErr("");
        }
      })
      .catch((e) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Erreur");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  const days = useMemo(() => [...(data?.daily || [])].reverse(), [data]);
  const maxDay = Math.max(1, ...days.map((day) => day.views));
  const todayKey = new Date().toISOString().slice(0, 10);

  async function onExport() {
    try {
      const res = await fetch(adminApi.visitsExportUrl(period), {
        credentials: "include",
        headers: { Accept: "text/csv" },
      });
      if (!res.ok) throw new Error("Export impossible");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `visites-${period}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Export échoué");
    }
  }

  const summary = data?.summary;

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-black">Visites</h1>
          <p className="mt-1 max-w-xl text-sm text-brand-black/60">
            Rapport du jour, provenance, produits consultés et demandes.
            {data ? ` Période du ${data.range.from} au ${data.range.to}.` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full bg-white p-1 shadow-sm">
            {PERIODS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPeriod(item.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  period === item.id ? "bg-brand-orange text-white" : "text-brand-black/60"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onExport}
            className="rounded-full border border-brand-black/10 bg-white px-4 py-2 text-xs font-bold text-brand-black"
          >
            Export CSV
          </button>
        </div>
      </div>

      {err ? <p className="mt-4 text-sm text-red-600">{err}</p> : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl bg-brand-black p-4 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Aujourd’hui</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums">
            {loading && !summary ? "—" : (summary?.today ?? 0).toLocaleString("fr-FR")}
          </p>
          <p className="mt-1 text-sm text-white/80">
            pages vues · {(summary?.unique_today ?? 0).toLocaleString("fr-FR")} visiteurs
          </p>
          <p className="mt-2 text-xs font-semibold text-brand-orange">
            {summary ? formatDelta(summary.today, summary.yesterday) : "Chargement…"}
          </p>
        </article>
        {[
          { label: "Hier", value: summary?.yesterday, hint: "pages vues" },
          { label: "Pages vues", value: summary?.pageviews, hint: summary ? `moy. ${summary.avg_per_day} / jour` : "" },
          { label: "Visiteurs", value: summary?.unique_visitors, hint: summary ? `${summary.sessions.toLocaleString("fr-FR")} sessions` : "" },
        ].map((card) => (
          <article key={card.label} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-black/45">{card.label}</p>
            <p className="mt-1 text-3xl font-extrabold tabular-nums text-brand-black">
              {loading && !summary ? "—" : (card.value ?? 0).toLocaleString("fr-FR")}
            </p>
            <p className="mt-1 text-xs text-brand-black/50">{card.hint}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <section className="rounded-2xl bg-white p-4 shadow-sm md:p-5">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <h2 className="font-bold text-brand-black">Rapport journalier</h2>
              <p className="mt-0.5 text-xs text-brand-black/50">Pages vues et visiteurs, du plus récent au plus ancien</p>
            </div>
          </div>
          <ul className="mt-4 max-h-[28rem] space-y-1.5 overflow-y-auto pr-1">
            {days.map((day) => {
              const isToday = day.date === todayKey;
              return (
                <li
                  key={day.date}
                  className={`grid grid-cols-[4.75rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-1.5 ${
                    isToday ? "bg-brand-orange/10" : ""
                  }`}
                >
                  <span className="text-xs font-bold tabular-nums text-brand-black">
                    {isToday ? "Aujourd’hui" : day.label}
                  </span>
                  <div className="h-2 overflow-hidden rounded-full bg-brand-black/5">
                    <div
                      className="h-full rounded-full bg-brand-orange"
                      style={{ width: `${Math.max(day.views > 0 ? 4 : 0, (day.views / maxDay) * 100)}%` }}
                    />
                  </div>
                  <span className="text-right text-[11px] tabular-nums text-brand-black/60">
                    {day.views.toLocaleString("fr-FR")} vues · {day.visitors.toLocaleString("fr-FR")} vis.
                  </span>
                </li>
              );
            })}
            {!loading && days.length === 0 ? (
              <li className="text-sm text-brand-black/45">Aucune visite sur cette période.</li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm md:p-5">
          <h2 className="font-bold text-brand-black">Provenance</h2>
          <p className="mt-0.5 text-xs text-brand-black/50">D’où viennent les visites de la période</p>
          <div className="mt-4">
            <SourceList items={data?.sources || []} />
          </div>
          <h3 className="mb-3 mt-6 text-sm font-bold text-brand-black">Aujourd’hui</h3>
          <SourceList items={data?.today_sources || []} />
          {(data?.devices || []).length > 0 ? (
            <p className="mt-5 text-xs text-brand-black/50">
              Appareils :{" "}
              {(data?.devices || []).map((device) => `${device.label} ${device.pct} %`).join(" · ")}
            </p>
          ) : null}
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-4 shadow-sm md:p-5">
          <h2 className="font-bold text-brand-black">Produits les plus consultés</h2>
          <p className="mt-0.5 text-xs text-brand-black/50">Ouvertures de fiches produit</p>
          <ul className="mt-4 divide-y divide-black/5">
            {(data?.top_products || []).map((product, index) => (
              <li key={product.slug} className="flex items-center gap-3 py-2.5">
                <span className="w-5 shrink-0 text-xs font-bold text-brand-black/35">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-brand-black">{product.name}</p>
                  <p className="truncate text-[11px] text-brand-black/40">{product.path}</p>
                </div>
                <p className="shrink-0 text-right text-xs tabular-nums text-brand-black/60">
                  {product.views.toLocaleString("fr-FR")} vues
                  <span className="block">{product.visitors.toLocaleString("fr-FR")} vis.</span>
                </p>
              </li>
            ))}
            {!loading && (data?.top_products || []).length === 0 ? (
              <li className="py-2 text-sm text-brand-black/45">Aucune fiche produit consultée sur cette période.</li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm md:p-5">
          <h2 className="font-bold text-brand-black">Produits les plus demandés</h2>
          <p className="mt-0.5 text-xs text-brand-black/50">Devis envoyés et discussions ouvertes sur une fiche</p>
          <ul className="mt-4 divide-y divide-black/5">
            {(data?.product_requests || []).map((product) => (
              <li key={`${product.slug}-${product.name}`} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-brand-black">{product.name}</p>
                  <p className="text-[11px] text-brand-black/45">
                    {product.quotes.toLocaleString("fr-FR")} devis · {product.chats.toLocaleString("fr-FR")} discussions
                  </p>
                </div>
                <p className="shrink-0 text-sm font-extrabold tabular-nums text-brand-orange">
                  {product.total.toLocaleString("fr-FR")}
                </p>
              </li>
            ))}
            {!loading && (data?.product_requests || []).length === 0 ? (
              <li className="py-2 text-sm text-brand-black/45">
                Aucune demande sur cette période. Un devis ou une discussion sur une fiche apparaîtra ici.
              </li>
            ) : null}
          </ul>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-4 shadow-sm md:p-5">
          <h2 className="font-bold text-brand-black">Pages les plus vues</h2>
          <p className="mb-4 mt-0.5 text-xs text-brand-black/50">Toutes les pages, pas seulement les produits</p>
          <Meter
            empty="Aucune page vue sur cette période."
            items={(data?.top_pages || []).slice(0, 8).map((page) => ({
              label: page.title?.split("|")[0]?.trim() || page.path,
              value: page.views,
            }))}
          />
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm md:p-5">
          <h2 className="font-bold text-brand-black">Dernières visites</h2>
          <p className="mb-3 mt-0.5 text-xs text-brand-black/50">Page, provenance et appareil</p>
          <ul className="max-h-80 space-y-2 overflow-y-auto">
            {(data?.recent || []).map((row) => (
              <li key={row.id} className="flex items-start justify-between gap-3 border-b border-black/5 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-brand-black">
                    {row.title?.split("|")[0]?.trim() || row.path}
                  </p>
                  <p className="truncate text-[11px] text-brand-black/40">{row.path}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] font-semibold text-brand-black">{row.source || "direct"}</p>
                  <p className="text-[11px] text-brand-black/40">
                    {row.device || "—"}
                    {row.created_at
                      ? ` · ${new Date(row.created_at).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`
                      : ""}
                  </p>
                </div>
              </li>
            ))}
            {!loading && (data?.recent || []).length === 0 ? (
              <li className="text-sm text-brand-black/45">Pas encore de visite enregistrée.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
