"use client";

import { useEffect, useMemo, useState } from "react";
import { adminApi, type VisitsStats } from "@/lib/adminApi";

const PERIODS = [
  { id: "7d", label: "7 jours" },
  { id: "30d", label: "30 jours" },
  { id: "90d", label: "90 jours" },
  { id: "12m", label: "12 mois" },
] as const;

function LineChart({
  points,
  color = "#FF7A00",
}: {
  points: Array<{ label: string; value: number }>;
  color?: string;
}) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const coords = points
    .map((p, i) => {
      const x = points.length === 1 ? 50 : (i / (points.length - 1)) * 100;
      const y = 100 - (p.value / max) * 82 - 8;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div>
      <svg viewBox="0 0 100 100" className="h-48 w-full" preserveAspectRatio="none">
        <polyline fill="none" stroke={color} strokeWidth="2" points={coords} vectorEffect="non-scaling-stroke" />
        <polyline
          fill={`${color}22`}
          stroke="none"
          points={`0,100 ${coords} 100,100`}
        />
      </svg>
      <div className="mt-1 flex justify-between gap-1 overflow-hidden text-[10px] text-brand-black/40">
        {points.map((p, i) =>
          i % Math.ceil(points.length / 8) === 0 || i === points.length - 1 ? (
            <span key={`${p.label}-${i}`}>{p.label}</span>
          ) : (
            <span key={`${p.label}-${i}`} />
          )
        )}
      </div>
    </div>
  );
}

function BarList({
  items,
  color = "#FF7A00",
}: {
  items: Array<{ label: string; views: number; pct?: number }>;
  color?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.views));
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="truncate font-medium text-brand-black">{item.label}</span>
            <span className="shrink-0 text-xs text-brand-black/50">
              {item.views.toLocaleString("fr-FR")}
              {item.pct != null ? ` · ${item.pct}%` : ""}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-brand-black/5">
            <div
              className="h-full rounded-full"
              style={{ width: `${(item.views / max) * 100}%`, background: color }}
            />
          </div>
        </li>
      ))}
      {items.length === 0 ? (
        <li className="text-sm text-brand-black/45">Aucune donnée sur cette période.</li>
      ) : null}
    </ul>
  );
}

export default function AdminVisitesPage() {
  const [period, setPeriod] = useState<string>("30d");
  const [data, setData] = useState<VisitsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminApi
      .getVisitsStats(period)
      .then((s) => {
        if (!cancelled) {
          setData(s);
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

  const dailyPoints = useMemo(
    () => (data?.daily || []).map((d) => ({ label: d.label, value: d.views })),
    [data]
  );
  const monthlyPoints = useMemo(
    () => (data?.monthly || []).map((d) => ({ label: d.label, value: d.views })),
    [data]
  );

  const cards = data
    ? [
        { label: "Pages vues", value: data.summary.pageviews, sub: `Moy. ${data.summary.avg_per_day}/j` },
        { label: "Visiteurs uniques", value: data.summary.unique_visitors, sub: `${data.summary.unique_today} aujourd’hui` },
        { label: "Sessions", value: data.summary.sessions, sub: `${data.summary.today} vues aujourd’hui` },
        { label: "Ce mois", value: data.summary.this_month, sub: `${data.summary.yesterday} hier` },
      ]
    : [];

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

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-black">Visites</h1>
          <p className="mt-1 text-sm text-brand-black/60">
            Pages vues, sources et évolution — tracking en temps réel
            {data ? ` · ${data.range.from} → ${data.range.to}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full bg-white p-1 shadow-sm">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  period === p.id ? "bg-brand-orange text-white" : "text-brand-black/60"
                }`}
              >
                {p.label}
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(loading && !data ? Array.from({ length: 4 }) : cards).map((c, i) =>
          c ? (
            <div key={c.label} className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-brand-black/55">{c.label}</p>
              <p className="mt-1 text-3xl font-extrabold text-brand-black">
                {c.value.toLocaleString("fr-FR")}
              </p>
              <p className="mt-1 text-xs text-brand-black/45">{c.sub}</p>
            </div>
          ) : (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white shadow-sm" />
          )
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="font-bold text-brand-black">
            {period === "12m" ? "Évolution mensuelle" : "Évolution quotidienne"}
          </h2>
          <p className="mt-1 text-xs text-brand-black/50">Pages vues sur la période sélectionnée</p>
          <div className="mt-4">
            {loading && !data ? (
              <div className="h-48 animate-pulse rounded-xl bg-brand-black/5" />
            ) : (
              <LineChart points={period === "12m" ? monthlyPoints : dailyPoints} />
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-bold text-brand-black">Sources</h2>
          <p className="mb-4 mt-1 text-xs text-brand-black/50">D’où viennent les visiteurs</p>
          <BarList
            items={(data?.sources || []).map((s) => ({
              label: s.label,
              views: s.views,
              pct: s.pct,
            }))}
            color="#2B7CFF"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-bold text-brand-black">Pages les plus vues</h2>
          <p className="mb-4 mt-1 text-xs text-brand-black/50">Top pages de la période</p>
          <BarList
            items={(data?.top_pages || []).map((p) => ({
              label: p.title || p.path,
              views: p.views,
            }))}
          />
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-bold text-brand-black">Appareils</h2>
          <p className="mb-4 mt-1 text-xs text-brand-black/50">Répartition desktop / mobile / tablette</p>
          <BarList
            items={(data?.devices || []).map((d) => ({
              label: d.label,
              views: d.views,
              pct: d.pct,
            }))}
            color="#25D366"
          />

          <h3 className="mb-3 mt-8 font-bold text-brand-black">Activité récente</h3>
          <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
            {(data?.recent || []).map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-brand-black">{r.title || r.path}</p>
                  <p className="text-xs text-brand-black/45">
                    {r.path} · {r.source || "—"} · {r.device || "—"}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-brand-black/40">
                  {r.created_at
                    ? new Date(r.created_at).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </span>
              </li>
            ))}
            {!loading && (data?.recent || []).length === 0 ? (
              <li className="text-brand-black/45">Pas encore de hits enregistrés.</li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
