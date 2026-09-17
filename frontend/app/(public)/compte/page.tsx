"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  clearCustomerToken,
  customerApi,
  CustomerProfile,
  hasCustomerSession,
} from "@/lib/customerApi";

export default function ComptePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [smsOpt, setSmsOpt] = useState(true);
  const [emailOpt, setEmailOpt] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyNinea, setCompanyNinea] = useState("");
  const [companyMsg, setCompanyMsg] = useState("");
  const [orders, setOrders] = useState<Array<Record<string, unknown>>>([]);
  const [wishlist, setWishlist] = useState<import("@/lib/api").Product[]>([]);

  async function refresh() {
    const p = await customerApi.me();
    setProfile(p);
    setName(p.name || "");
    setEmail(p.email || "");
    setSmsOpt(p.sms_opt_in !== false);
    setEmailOpt(p.email_opt_in !== false);
    const [ords, wish] = await Promise.all([
      customerApi.getOrders().catch(() => []),
      customerApi.getWishlist().catch(() => []),
    ]);
    setOrders(ords);
    setWishlist(wish);
  }

  useEffect(() => {
    hasCustomerSession().then((ok) => {
      if (!ok) {
        router.replace("/compte/connexion");
        return;
      }
      refresh().catch(async () => {
        await clearCustomerToken();
        router.replace("/compte/connexion");
      });
    });
  }, [router]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await customerApi.updateProfile({
        name,
        email,
        sms_opt_in: smsOpt,
        email_opt_in: emailOpt,
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function createCompany(e: FormEvent) {
    e.preventDefault();
    setCompanyMsg("");
    setError("");
    try {
      const res = await customerApi.registerCompany({
        name: companyName,
        ninea: companyNinea || undefined,
        email: email || undefined,
      });
      setCompanyMsg(res.message);
      setCompanyName("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  async function logout() {
    await customerApi.logout();
    router.push("/");
  }

  if (!profile) {
    return <p className="py-20 text-center text-sm text-brand-black/50">Chargement…</p>;
  }

  return (
    <div className="flex flex-1 flex-col bg-[#ececec] px-4 py-10 md:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-orange">
              Mon compte{profile.is_b2b ? " · Entreprise" : ""}
            </p>
            <h1 className="text-2xl font-extrabold text-brand-black">
              {profile.name || "Bienvenue"}
            </h1>
            <p className="text-sm text-brand-black/60">
              {profile.phone ? `+${profile.phone}` : profile.email}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/compte/notifications"
              className="rounded-full border border-brand-black/20 px-4 py-2 text-sm font-semibold"
            >
              Notifications
            </Link>
            <Link
              href="/compte/notifications/preferences"
              className="rounded-full border border-brand-black/20 px-4 py-2 text-sm font-semibold"
            >
              Alertes
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-brand-black/20 px-4 py-2 text-sm font-semibold"
            >
              Déconnexion
            </button>
          </div>
        </div>

        <form onSubmit={saveProfile} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-bold text-brand-black">Informations personnelles</h2>
          <div>
            <label className="mb-1 block text-sm text-brand-black/70">Nom</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-brand-black/15 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-brand-black/70">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-brand-black/15 px-3 py-2.5 text-sm"
            />
          </div>
          <div className="space-y-2 rounded-xl bg-[#f5f5f5] p-3 text-sm">
            <p className="font-semibold text-brand-black">Notifications promo</p>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={smsOpt} onChange={(e) => setSmsOpt(e.target.checked)} />
              Recevoir les SMS promo
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={emailOpt}
                onChange={(e) => setEmailOpt(e.target.checked)}
              />
              Recevoir les emails promo
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand-orange px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>

        {!profile.company ? (
          <form onSubmit={createCompany} className="space-y-3 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-bold text-brand-black">Espace entreprise</h2>
            <p className="text-sm text-brand-black/60">
              Créez votre fiche société pour accéder aux devis groupés et factures B2B.
            </p>
            <input
              required
              placeholder="Raison sociale"
              className="w-full rounded-xl border border-brand-black/15 px-3 py-2.5 text-sm"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
            <input
              placeholder="NINEA (optionnel)"
              className="w-full rounded-xl border border-brand-black/15 px-3 py-2.5 text-sm"
              value={companyNinea}
              onChange={(e) => setCompanyNinea(e.target.value)}
            />
            {companyMsg && <p className="text-sm text-green-700">{companyMsg}</p>}
            <button
              type="submit"
              className="rounded-full bg-brand-black px-5 py-2.5 text-sm font-bold text-white"
            >
              Créer mon espace entreprise
            </button>
          </form>
        ) : (
          <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
            <div>
              <h2 className="font-bold text-brand-black">Entreprise</h2>
              <p className="text-sm text-brand-black/70">{profile.company.name}</p>
              {profile.company.ninea && (
                <p className="text-xs text-brand-black/50">NINEA {profile.company.ninea}</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-orange">
                Devis groupés
              </h3>
              {!profile.b2b_quotes?.length ? (
                <p className="mt-2 text-sm text-brand-black/50">Aucun devis B2B pour le moment.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {profile.b2b_quotes.map((q) => (
                    <li key={q.id} className="rounded-xl bg-[#f5f5f5] p-3 text-sm">
                      <div className="flex justify-between gap-2">
                        <p className="font-semibold">
                          {q.reference} — {q.title}
                        </p>
                        <span className="text-brand-orange font-bold">
                          {q.total_amount.toLocaleString("fr-FR")} FCFA
                        </span>
                      </div>
                      <p className="text-xs uppercase text-brand-black/50">{q.status}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-orange">
                Factures
              </h3>
              {!profile.invoices?.length ? (
                <p className="mt-2 text-sm text-brand-black/50">Aucune facture.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {profile.invoices.map((inv) => (
                    <li key={inv.id} className="rounded-xl bg-[#f5f5f5] p-3 text-sm">
                      <div className="flex justify-between gap-2">
                        <p className="font-semibold">
                          {inv.reference} — {inv.title}
                        </p>
                        <span className="font-bold text-brand-orange">
                          {inv.amount.toLocaleString("fr-FR")} FCFA
                        </span>
                      </div>
                      <p className="text-xs uppercase text-brand-black/50">{inv.status}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-bold text-brand-black">Mes commandes</h2>
          {!orders.length ? (
            <p className="mt-4 text-sm text-brand-black/50">Aucune commande.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {orders.map((o) => (
                <li key={String(o.id)} className="rounded-xl bg-[#f5f5f5] p-4 text-sm">
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-semibold">{String(o.reference)}</p>
                    <span className="text-xs uppercase text-brand-orange">{String(o.order_status)}</span>
                  </div>
                  <p className="mt-1 font-bold text-brand-orange">
                    {Number(o.total || 0).toLocaleString("fr-FR")} FCFA
                  </p>
                  {["en_attente", "confirmee"].includes(String(o.order_status)) && (
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-red-600"
                      onClick={() =>
                        customerApi.cancelOrder(Number(o.id)).then(refresh).catch((e) =>
                          setError(e instanceof Error ? e.message : "Erreur")
                        )
                      }
                    >
                      Annuler
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-bold text-brand-black">Liste de souhaits</h2>
          {!wishlist.length ? (
            <p className="mt-4 text-sm text-brand-black/50">Aucun favori.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {wishlist.map((p) => (
                <li key={p.id} className="flex justify-between rounded-xl bg-[#f5f5f5] p-3 text-sm">
                  <Link href={`/produits/${p.slug}`} className="font-semibold hover:text-brand-orange">
                    {p.name}
                  </Link>
                  <button
                    type="button"
                    className="text-xs text-red-600"
                    onClick={() => customerApi.removeWishlist(p.id).then(refresh)}
                  >
                    Retirer
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold text-brand-black">Historique des devis</h2>
            <Link href="/devis" className="text-sm font-semibold text-brand-orange">
              Nouveau devis
            </Link>
          </div>
          {!profile.quotes?.length ? (
            <p className="mt-4 text-sm text-brand-black/50">Aucun devis pour le moment.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {profile.quotes.map((q) => (
                <li key={q.id} className="rounded-xl bg-[#f5f5f5] p-4 text-sm">
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-semibold text-brand-black">
                      {q.product?.name || "Demande libre"}
                    </p>
                    <span className="text-xs font-semibold uppercase text-brand-orange">
                      {q.status}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-brand-black/70">{q.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
