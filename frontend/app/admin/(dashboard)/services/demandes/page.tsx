"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, type AdminServiceRequest } from "@/lib/adminApi";

const STATUSES = [
  { value: "nouveau", label: "Nouveau" },
  { value: "en_cours", label: "En cours" },
  { value: "traite", label: "Traité" },
  { value: "annule", label: "Annulé" },
];

export default function AdminServiceRequestsPage() {
  const [rows, setRows] = useState<AdminServiceRequest[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await adminApi.getServiceRequests(status ? { status } : undefined));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/services" className="text-sm text-brand-orange">
            ← Services
          </Link>
          <h1 className="mt-1 text-2xl font-extrabold">Demandes de service</h1>
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border bg-white px-3 py-2 text-sm"
        >
          <option value="">Tous les statuts</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-brand-black/60">Chargement…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-sm text-brand-black/60">Aucune demande.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <article key={row.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-brand-black">
                    {row.customer_name} · {row.phone}
                  </p>
                  <p className="text-xs text-brand-black/50">
                    {row.service?.title || `Service #${row.service_id}`} ·{" "}
                    {new Date(row.created_at).toLocaleString("fr-FR")}
                  </p>
                  {row.product_reference ? (
                    <p className="mt-1 text-xs text-brand-black/60">Réf. : {row.product_reference}</p>
                  ) : null}
                  <p className="mt-2 whitespace-pre-line text-sm text-brand-black/80">{row.message}</p>
                </div>
                <select
                  value={row.status}
                  onChange={async (e) => {
                    await adminApi.updateServiceRequestStatus(row.id, { status: e.target.value });
                    await load();
                  }}
                  className="rounded-lg border px-3 py-2 text-sm"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
