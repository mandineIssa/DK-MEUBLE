"use client";

import { FormEvent, useEffect, useState } from "react";
import { adminApi, AdminShowroom } from "@/lib/adminApi";
import EntityMediaPanel from "@/components/admin/EntityMediaPanel";

export default function AdminShowroomsPage() {
  const [items, setItems] = useState<AdminShowroom[]>([]);
  const [error, setError] = useState("");
  const empty = {
    name: "",
    address: "",
    city: "",
    phone: "",
    latitude: "",
    longitude: "",
    opening_hours: "",
    is_active: true,
  };
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<AdminShowroom | null>(null);

  async function load() {
    setItems(await adminApi.getShowrooms());
  }
  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : "Erreur"));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
    };
    try {
      if (editing) await adminApi.updateShowroom(editing.id, payload);
      else await adminApi.createShowroom(payload);
      setForm(empty);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-extrabold">Showrooms</h1>
      <form onSubmit={onSubmit} className="mt-6 grid max-w-2xl gap-3 rounded-2xl bg-white p-5 shadow-sm sm:grid-cols-2">
        <input required placeholder="Nom *" className="rounded-xl border px-3 py-2 sm:col-span-2" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <input required placeholder="Adresse *" className="rounded-xl border px-3 py-2 sm:col-span-2" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        <input placeholder="Ville" className="rounded-xl border px-3 py-2" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
        <input placeholder="Téléphone" className="rounded-xl border px-3 py-2" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        <input placeholder="Latitude" className="rounded-xl border px-3 py-2" value={form.latitude} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))} />
        <input placeholder="Longitude" className="rounded-xl border px-3 py-2" value={form.longitude} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))} />
        <textarea placeholder="Horaires" className="rounded-xl border px-3 py-2 sm:col-span-2" value={form.opening_hours} onChange={(e) => setForm((f) => ({ ...f, opening_hours: e.target.value }))} />
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
        <button type="submit" className="rounded-full bg-brand-orange px-5 py-2 text-sm font-semibold text-white sm:col-span-2">
          {editing ? "Enregistrer" : "Ajouter"}
        </button>
        {editing ? (
          <div className="sm:col-span-2">
            <EntityMediaPanel type="showrooms" entityId={editing.id} title="Photos showroom" />
          </div>
        ) : null}
      </form>
      <ul className="mt-6 space-y-2">
        {items.map((s) => (
          <li key={s.id} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex justify-between gap-2">
              <div>
                <p className="font-bold">{s.name}</p>
                <p className="text-sm text-brand-black/60">{s.address}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="text-sm font-semibold text-brand-orange" onClick={() => {
                  setEditing(s);
                  setForm({
                    name: s.name,
                    address: s.address,
                    city: s.city || "",
                    phone: s.phone || "",
                    latitude: s.latitude != null ? String(s.latitude) : "",
                    longitude: s.longitude != null ? String(s.longitude) : "",
                    opening_hours: s.opening_hours || "",
                    is_active: s.is_active,
                  });
                }}>Éditer</button>
                <button type="button" className="text-sm font-semibold text-red-600" onClick={() => adminApi.deleteShowroom(s.id).then(load)}>Suppr.</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
