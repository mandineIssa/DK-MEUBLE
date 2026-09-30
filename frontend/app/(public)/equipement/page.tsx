"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/components/CartProvider";
import { useWaLink } from "@/components/SiteProvider";
import { aiApi, type AiProduct } from "@/lib/ai";
import type { Product } from "@/lib/api";
import { WHATSAPP_GENERAL_MESSAGE } from "@/lib/whatsappMessage";

type Item = { product: AiProduct; quantity: number; note: string | null };

function EquipementForm() {
  const params = useSearchParams();
  const initial = params.get("mode") === "bureau" || params.get("secteur") ? "bureau" : "maison";
  const [mode, setMode] = useState<"maison" | "bureau" | "secteur">(params.get("secteur") ? "secteur" : initial);
  const [housing, setHousing] = useState("appartement");
  const [rooms, setRooms] = useState("3");
  const [budget, setBudget] = useState("");
  const [style, setStyle] = useState("");
  const [wants, setWants] = useState("");
  const [employees, setEmployees] = useState("1");
  const [desks, setDesks] = useState("1");
  const [sector, setSector] = useState(params.get("secteur") || "entreprise");
  const [items, setItems] = useState<Item[]>([]);
  const [removed, setRemoved] = useState<number[]>([]);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const { addToCart } = useCart();
  const wa = useWaLink(WHATSAPP_GENERAL_MESSAGE);

  const visible = useMemo(() => items.filter((item) => !removed.includes(item.product.id)), [items, removed]);
  const visibleTotal = visible.reduce((sum, item) => sum + (item.product.effective_price || 0) * item.quantity, 0);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = await aiApi.plan({
        mode,
        housing,
        rooms: Number(rooms) || undefined,
        budget: budget ? Number(budget) : undefined,
        style,
        wants: wants.split(",").map((item) => item.trim()).filter(Boolean),
        employees: Number(employees) || undefined,
        desks: Number(desks) || undefined,
        sector: mode === "secteur" ? sector : undefined,
      });
      setItems(result.items || []);
      setRemoved([]);
      setTotal(result.total || 0);
      setMessage(result.message);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Sélection impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function addAll() {
    for (const item of visible) {
      await addToCart(item.product.id, item.quantity);
    }
  }

  const payload = {
    mode,
    housing,
    rooms: Number(rooms) || undefined,
    budget: budget ? Number(budget) : undefined,
    style,
    wants: wants.split(",").map((item) => item.trim()).filter(Boolean),
    employees: Number(employees) || undefined,
    desks: Number(desks) || undefined,
    sector: mode === "secteur" ? sector : undefined,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <h1 className="text-3xl font-extrabold text-brand-black">Équipez votre espace</h1>
      <p className="mt-2 text-sm text-brand-black/70">La proposition utilise uniquement les produits et les prix du catalogue.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(["maison", "bureau", "secteur"] as const).map((value) => (
          <button key={value} type="button" onClick={() => setMode(value)} className={`rounded-full px-4 py-2 text-sm font-bold ${mode === value ? "bg-brand-orange text-white" : "bg-white"}`}>
            {value === "maison" ? "Ma maison" : value === "bureau" ? "Mon bureau" : "Mon secteur"}
          </button>
        ))}
      </div>
      <form onSubmit={onSubmit} className="mt-6 grid gap-4 rounded-2xl bg-white p-5 shadow-sm md:grid-cols-2">
        {mode === "maison" ? (
          <>
            <label className="text-sm font-semibold">Type de logement
              <select value={housing} onChange={(e) => setHousing(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2">
                <option value="appartement">Appartement</option>
                <option value="maison">Maison</option>
                <option value="studio">Studio</option>
                <option value="villa">Villa</option>
              </select>
            </label>
            <label className="text-sm font-semibold">Nombre de pièces
              <input value={rooms} onChange={(e) => setRooms(e.target.value.replace(/\D/g, ""))} className="mt-1 w-full rounded-xl border px-3 py-2" inputMode="numeric" />
            </label>
          </>
        ) : null}
        {mode === "bureau" ? (
          <>
            <label className="text-sm font-semibold">Nombre d'employés
              <input value={employees} onChange={(e) => setEmployees(e.target.value.replace(/\D/g, ""))} className="mt-1 w-full rounded-xl border px-3 py-2" inputMode="numeric" />
            </label>
            <label className="text-sm font-semibold">Nombre de bureaux
              <input value={desks} onChange={(e) => setDesks(e.target.value.replace(/\D/g, ""))} className="mt-1 w-full rounded-xl border px-3 py-2" inputMode="numeric" />
            </label>
          </>
        ) : null}
        {mode === "secteur" ? (
          <label className="text-sm font-semibold md:col-span-2">Secteur
            <select value={sector} onChange={(e) => setSector(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2">
              <option value="hotel">Hôtel</option>
              <option value="restaurant">Restaurant</option>
              <option value="ecole">École</option>
              <option value="entreprise">Entreprise</option>
              <option value="administration">Administration</option>
              <option value="commerce">Commerce</option>
            </select>
          </label>
        ) : null}
        <label className="text-sm font-semibold">Budget (FCFA)
          <input value={budget} onChange={(e) => setBudget(e.target.value.replace(/\D/g, ""))} className="mt-1 w-full rounded-xl border px-3 py-2" inputMode="numeric" />
        </label>
        <label className="text-sm font-semibold">Style souhaité
          <input value={style} onChange={(e) => setStyle(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2" />
        </label>
        <label className="text-sm font-semibold md:col-span-2">Produits souhaités, séparés par des virgules
          <input value={wants} onChange={(e) => setWants(e.target.value)} placeholder="canapé, lit, réfrigérateur" className="mt-1 w-full rounded-xl border px-3 py-2" />
        </label>
        <button type="submit" disabled={busy} className="rounded-full bg-brand-orange px-5 py-3 text-sm font-bold text-white md:col-span-2">
          {busy ? "Recherche…" : "Générer mon projet"}
        </button>
      </form>
      {message ? <p className="mt-4 text-sm text-brand-black/80">{message}</p> : null}
      {visible.length > 0 ? (
        <div className="mt-6">
          <p className="text-sm font-semibold">Budget estimé : {budget ? `${Number(budget).toLocaleString("fr-FR")} FCFA` : "non indiqué"}</p>
          <p className="text-lg font-extrabold">Total : {(visibleTotal || total).toLocaleString("fr-FR")} FCFA</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {visible.map((item) => (
              <div key={item.product.id}>
                <ProductCard product={item.product as Product} />
                <p className="mt-1 text-sm">Quantité : {item.quantity}</p>
                {item.note ? <p className="text-xs text-brand-black/60">{item.note}</p> : null}
                <button type="button" className="text-xs font-bold text-brand-black/60" onClick={() => setRemoved((list) => [...list, item.product.id])}>
                  Retirer
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => addAll().catch(() => undefined)} className="rounded-full bg-brand-black px-4 py-2 text-sm font-bold text-white">Ajouter toute la sélection au panier</button>
            <button type="button" onClick={() => aiApi.planPdf(payload).catch((err) => setMessage(err.message))} className="rounded-full border px-4 py-2 text-sm font-bold">Générer un devis PDF</button>
            <a href="/devis" className="rounded-full border px-4 py-2 text-sm font-bold">Demander un devis</a>
            {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-full border px-4 py-2 text-sm font-bold">Contacter DK HOMETECH sur WhatsApp</a> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function EquipementPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm">Chargement…</p>}>
      <EquipementForm />
    </Suspense>
  );
}
