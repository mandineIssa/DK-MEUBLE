"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, type AdminNewsletterSubscriber } from "@/lib/adminApi";

export default function AdminNewsletterPage() {
  const [rows, setRows] = useState<AdminNewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      setRows(await adminApi.getNewsletterSubscribers());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function exportCsv() {
    const header = "email,source,subscribed_at\n";
    const body = rows
      .map((r) => `${r.email},${r.source},${r.subscribed_at || r.created_at}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "newsletter-abonnes.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-black">Newsletter</h1>
          <p className="text-sm text-brand-black/60">
            Inscriptions provenant du formulaire de la page d&apos;accueil ({rows.length})
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!rows.length}
          className="rounded-full bg-brand-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          Exporter CSV
        </button>
      </div>

      {err ? <p className="mb-3 text-sm text-red-600">{err}</p> : null}
      {loading ? <p className="text-sm text-brand-black/50">Chargement…</p> : null}

      {!loading && rows.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-brand-black/50 shadow-sm">
          Aucun abonné pour le moment.
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm"
          >
            <div>
              <p className="font-semibold text-brand-black">{row.email}</p>
              <p className="text-xs text-brand-black/50">
                Source : {row.source} ·{" "}
                {new Date(row.subscribed_at || row.created_at).toLocaleString("fr-FR")}
              </p>
            </div>
            <button
              type="button"
              className="text-xs font-semibold text-red-600"
              onClick={async () => {
                if (!confirm("Supprimer cet abonné ?")) return;
                await adminApi.deleteNewsletterSubscriber(row.id);
                await load();
              }}
            >
              Supprimer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
