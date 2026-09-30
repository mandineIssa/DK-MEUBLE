"use client";

import { FormEvent, useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";

type Insights = {
  sales: { revenue: number; orders: number; average_basket: number; enough: boolean };
  products: { most_viewed: Array<{ path: string; views: number }>; most_sold: Array<{ product_name: string; qty: number }>; never_sold: number; low_stock: number };
  search: { frequent: Array<{ query: string; times: number }>; without_result: number; enough: boolean };
  carts: { inactive_24h: number; inactive_value: number; note: string };
  opportunities: string[];
  errors: Array<{ kind: string; message: string | null; created_at: string }>;
  usage: { calls: number; errors: number };
};

type AiSettings = {
  enabled: boolean;
  assistant_enabled: boolean;
  provider: string;
  model: string;
  base_url: string;
  timeout: number;
  retries: number;
  system_prompt: string;
  api_key_configured: boolean;
};

const emptySettings: AiSettings = {
  enabled: true,
  assistant_enabled: true,
  provider: "openai",
  model: "",
  base_url: "",
  timeout: 12,
  retries: 1,
  system_prompt: "",
  api_key_configured: false,
};

export default function IntelligencePage() {
  const [data, setData] = useState<Insights | null>(null);
  const [settings, setSettings] = useState<AiSettings>(emptySettings);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    adminApi.aiInsights().then(setData).catch(() => setMessage("Indicateurs indisponibles."));
    adminApi.aiSettings().then((saved) => {
      setSettings({ ...emptySettings, ...saved });
      setReady(true);
    }).catch(() => undefined);
  }, []);

  async function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const saved = await adminApi.updateAiSettings({
      enabled: settings.enabled,
      assistant_enabled: settings.assistant_enabled,
      provider: settings.provider,
      model: settings.model,
      base_url: settings.base_url,
      timeout: Number(settings.timeout) || 12,
      retries: Number(settings.retries) || 0,
      system_prompt: settings.system_prompt,
    });
    setSettings({ ...emptySettings, ...saved });
    setMessage("Paramètres enregistrés. La clé API reste dans le fichier .env du serveur.");
  }

  const money = (value: number) => `${value.toLocaleString("fr-FR")} FCFA`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">DK HOMETECH Intelligence</h1>
      {message ? <p className="text-sm">{message}</p> : null}
      {data ? (
        <>
          <section className="grid gap-3 md:grid-cols-3">
            <article className="rounded-2xl bg-white p-4"><p className="text-xs uppercase">Chiffre d'affaires</p><p className="text-xl font-extrabold">{money(data.sales.revenue)}</p></article>
            <article className="rounded-2xl bg-white p-4"><p className="text-xs uppercase">Commandes</p><p className="text-xl font-extrabold">{data.sales.orders}</p></article>
            <article className="rounded-2xl bg-white p-4"><p className="text-xs uppercase">Panier moyen</p><p className="text-xl font-extrabold">{data.sales.enough ? money(data.sales.average_basket) : "Données insuffisantes"}</p></article>
          </section>
          <section className="rounded-2xl bg-white p-4">
            <h2 className="font-bold">Produits</h2>
            <p className="mt-2 text-sm">Sans vente : {data.products.never_sold}. Stock entre 1 et 3 : {data.products.low_stock}.</p>
            <ul className="mt-2 text-sm">{data.products.most_sold.map((row) => <li key={row.product_name}>{row.product_name} — {row.qty} vendu(s)</li>)}</ul>
            <ul className="mt-2 text-sm">{data.products.most_viewed.map((row) => <li key={row.path}>{row.path} — {row.views} vue(s)</li>)}</ul>
          </section>
          <section className="rounded-2xl bg-white p-4">
            <h2 className="font-bold">Recherche</h2>
            {data.search.enough ? <ul className="mt-2 text-sm">{data.search.frequent.map((row) => <li key={row.query}>{row.query} — {row.times}</li>)}</ul> : <p className="mt-2 text-sm">Données insuffisantes pour classer les recherches.</p>}
            <p className="mt-2 text-sm">Recherches sans résultat : {data.search.without_result}</p>
          </section>
          <section className="rounded-2xl bg-white p-4">
            <h2 className="font-bold">Paniers</h2>
            <p className="mt-2 text-sm">Inactifs depuis 24 h : {data.carts.inactive_24h}. Valeur catalogue : {money(data.carts.inactive_value)}.</p>
            <p className="text-sm">{data.carts.note}</p>
          </section>
          <section className="rounded-2xl bg-white p-4">
            <h2 className="font-bold">Opportunités détectées</h2>
            <ul className="mt-2 text-sm">{data.opportunities.map((line) => <li key={line}>{line}</li>)}</ul>
            <p className="mt-3 text-sm">Appels IA : {data.usage.calls}. Erreurs : {data.usage.errors}.</p>
            <ul className="mt-2 text-xs text-brand-black/70">{data.errors.map((row) => <li key={row.created_at + row.kind}>{row.kind} — {row.message}</li>)}</ul>
          </section>
        </>
      ) : null}
      <form onSubmit={onSave} className="space-y-3 rounded-2xl bg-white p-4">
        <h2 className="font-bold">Réglages</h2>
        <p className="text-sm">Clé API : {settings.api_key_configured ? "présente dans le fichier .env (AI_API_KEY). Elle n'est pas enregistrée ici." : "absente du fichier .env. Le catalogue reste utilisé seul."}</p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={settings.enabled} onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))} />
          Activer les appels au fournisseur
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={settings.assistant_enabled} onChange={(e) => setSettings((s) => ({ ...s, assistant_enabled: e.target.checked }))} />
          Afficher l'assistant sur le site
        </label>
        <label className="block text-sm">Fournisseur
          <input value={settings.provider} onChange={(e) => setSettings((s) => ({ ...s, provider: e.target.value }))} className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="openai" />
        </label>
        <label className="block text-sm">Adresse du fournisseur
          <input value={settings.base_url} onChange={(e) => setSettings((s) => ({ ...s, base_url: e.target.value }))} className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="https://api.openai.com/v1" />
        </label>
        <label className="block text-sm">Modèle
          <input value={settings.model} onChange={(e) => setSettings((s) => ({ ...s, model: e.target.value }))} className="mt-1 w-full rounded-xl border px-3 py-2" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">Délai (secondes)
            <input type="number" min={3} max={60} value={settings.timeout} onChange={(e) => setSettings((s) => ({ ...s, timeout: Number(e.target.value) }))} className="mt-1 w-full rounded-xl border px-3 py-2" />
          </label>
          <label className="block text-sm">Nouvelles tentatives
            <input type="number" min={0} max={3} value={settings.retries} onChange={(e) => setSettings((s) => ({ ...s, retries: Number(e.target.value) }))} className="mt-1 w-full rounded-xl border px-3 py-2" />
          </label>
        </div>
        <label className="block text-sm">Consignes du magasin
          <textarea value={settings.system_prompt} onChange={(e) => setSettings((s) => ({ ...s, system_prompt: e.target.value }))} rows={4} className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="Ton, spécialités, ce que l'assistant peut dire." />
        </label>
        <button type="submit" disabled={!ready} className="rounded-full bg-brand-orange px-4 py-2 text-sm font-bold text-white disabled:opacity-60">Enregistrer</button>
      </form>
    </div>
  );
}
