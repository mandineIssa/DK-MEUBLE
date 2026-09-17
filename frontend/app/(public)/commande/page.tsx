"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, Showroom } from "@/lib/api";
import { cartApi, checkoutApi, CartSummary } from "@/lib/cartApi";

export default function CommandePage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [zones, setZones] = useState<
    Array<{ id: number; zone_name: string; delivery_fee: number; estimated_delay: string | null }>
  >([]);
  const [showrooms, setShowrooms] = useState<Showroom[]>([]);
  const [payments, setPayments] = useState<Array<{ key: string; label: string }>>([]);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    email: "",
    address: "",
    delivery_method: "domicile" as "domicile" | "retrait_showroom",
    delivery_zone_id: "",
    showroom_id: "",
    payment_method: "cash",
    customer_note: "",
  });

  useEffect(() => {
    Promise.all([
      cartApi.get(),
      api.getDeliveryZones(),
      api.getShowrooms(),
      api.getCheckoutOptions(),
    ])
      .then(([c, z, s, o]) => {
        setCart(c);
        setZones(z);
        setShowrooms(s);
        setPayments(o.payment_methods);
        if (o.payment_methods[0]) {
          setForm((f) => ({ ...f, payment_method: o.payment_methods[0].key }));
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, []);

  const deliveryFee = useMemo(() => {
    if (form.delivery_method !== "domicile") return 0;
    const z = zones.find((x) => String(x.id) === form.delivery_zone_id);
    return z?.delivery_fee || 0;
  }, [form.delivery_method, form.delivery_zone_id, zones]);

  const total = (cart?.subtotal || 0) + deliveryFee;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const order = await checkoutApi({
        ...form,
        delivery_zone_id: form.delivery_zone_id ? Number(form.delivery_zone_id) : null,
        showroom_id: form.showroom_id ? Number(form.showroom_id) : null,
      });
      window.dispatchEvent(new Event("cart-updated"));
      router.push(`/commande/confirmation?ref=${encodeURIComponent(order.reference)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec");
    } finally {
      setSending(false);
    }
  }

  if (!cart) return <p className="p-8 text-center text-brand-black/50">Chargement…</p>;
  if (cart.items_count < 1) {
    return (
      <p className="p-8 text-center">
        Panier vide. <a href="/produits" className="text-brand-orange">Catalogue</a>
      </p>
    );
  }

  return (
    <div className="bg-[#ececec]">
      <section className="bg-brand-black text-white">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <h1 className="text-3xl font-extrabold">Commande</h1>
        </div>
      </section>
      <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <div className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-bold">Informations</h2>
          <input
            required
            placeholder="Nom complet *"
            className="w-full rounded-xl border px-3 py-2"
            value={form.customer_name}
            onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
          />
          <input
            required
            placeholder="Téléphone *"
            className="w-full rounded-xl border px-3 py-2"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <input
            type="email"
            placeholder="Email (optionnel)"
            className="w-full rounded-xl border px-3 py-2"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>

        <div className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-bold">Livraison</h2>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={form.delivery_method === "domicile"}
                onChange={() => setForm((f) => ({ ...f, delivery_method: "domicile" }))}
              />
              À domicile
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={form.delivery_method === "retrait_showroom"}
                onChange={() => setForm((f) => ({ ...f, delivery_method: "retrait_showroom" }))}
              />
              Retrait showroom
            </label>
          </div>
          {form.delivery_method === "domicile" ? (
            <>
              <select
                required
                className="w-full rounded-xl border px-3 py-2"
                value={form.delivery_zone_id}
                onChange={(e) => setForm((f) => ({ ...f, delivery_zone_id: e.target.value }))}
              >
                <option value="">Zone de livraison *</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.zone_name} — {z.delivery_fee.toLocaleString("fr-FR")} FCFA
                    {z.estimated_delay ? ` (${z.estimated_delay})` : ""}
                  </option>
                ))}
              </select>
              <textarea
                required
                placeholder="Adresse de livraison *"
                className="w-full rounded-xl border px-3 py-2"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </>
          ) : (
            <select
              required
              className="w-full rounded-xl border px-3 py-2"
              value={form.showroom_id}
              onChange={(e) => setForm((f) => ({ ...f, showroom_id: e.target.value }))}
            >
              <option value="">Choisir un showroom *</option>
              {showrooms.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.address}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-bold">Paiement</h2>
          {payments.map((p) => (
            <label key={p.key} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="pay"
                checked={form.payment_method === p.key}
                onChange={() => setForm((f) => ({ ...f, payment_method: p.key }))}
              />
              {p.label}
            </label>
          ))}
          <textarea
            placeholder="Note (optionnel)"
            className="w-full rounded-xl border px-3 py-2"
            value={form.customer_note}
            onChange={(e) => setForm((f) => ({ ...f, customer_note: e.target.value }))}
          />
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="flex justify-between text-sm">
            <span>Sous-total</span>
            <span>{cart.subtotal.toLocaleString("fr-FR")} FCFA</span>
          </p>
          <p className="mt-1 flex justify-between text-sm">
            <span>Livraison</span>
            <span>{deliveryFee.toLocaleString("fr-FR")} FCFA</span>
          </p>
          <p className="mt-3 flex justify-between text-lg font-extrabold">
            <span>Total</span>
            <span>{total.toLocaleString("fr-FR")} FCFA</span>
          </p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={sending}
            className="mt-4 w-full rounded-full bg-brand-orange py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {sending ? "Validation…" : "Confirmer la commande"}
          </button>
        </div>
      </form>
    </div>
  );
}
