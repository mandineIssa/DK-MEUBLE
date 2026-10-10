"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { aiApi } from "@/lib/ai";
import type { Product } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

function RechercheResults() {
  const params = useSearchParams();
  const initial = params.get("q") || "";
  const [q, setQ] = useState(initial);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [voiceError, setVoiceError] = useState("");

  async function run(term: string, source: "text" | "voice" = "text") {
    if (term.trim().length < 2) return;
    setBusy(true);
    setVoiceError("");
    try {
      const result = await aiApi.search(term.trim(), source);
      setProducts((result.products || []) as Product[]);
      setNote(result.message || "");
    } catch {
      setProducts([]);
      setNote("La recherche est indisponible pour le moment.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (initial) run(initial);
    // La requête d'URL lance une seule recherche catalogue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    run(q);
  }

  function listen() {
    type Recognition = { lang: string; start: () => void; onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null };
    const browser = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const Ctor = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!Ctor) {
      setVoiceError("La reconnaissance vocale n'est pas disponible sur ce navigateur. Saisissez votre recherche.");
      return;
    }
    const recognition = new Ctor();
    recognition.lang = "fr-FR";
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      if (!transcript) return;
      setQ(transcript);
      run(transcript, "voice");
    };
    recognition.start();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <h1 className="text-3xl font-extrabold text-brand-black">Recherche</h1>
      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nom, marque ou référence"
          enterKeyHint="search"
          type="search"
          className="min-w-0 flex-1 rounded-full border bg-white px-4 py-3 text-base"
          aria-label="Rechercher un produit"
        />
        {q ? (
          <button type="button" aria-label="Effacer la recherche" className="rounded-full border bg-white px-3 text-lg" onClick={() => { setQ(""); setProducts(null); setNote(""); }}>
            ×
          </button>
        ) : null}
        <button type="button" onClick={listen} aria-label="Recherche vocale" className="rounded-full border bg-white px-4 text-sm font-bold">
          Micro
        </button>
        <button type="submit" className="rounded-full bg-brand-orange px-5 text-sm font-bold text-white">
          OK
        </button>
      </form>
      {voiceError ? <p className="mt-3 text-sm text-red-700">{voiceError}</p> : null}
      {busy ? <p className="mt-6 text-sm">Recherche dans le catalogue…</p> : null}
      {note ? <p className="mt-4 text-sm text-brand-black/70">{note}</p> : null}
      {products && products.length === 0 && !busy ? (
        <p className="mt-6 text-sm text-brand-black/70">Aucun produit ne correspond à cette recherche.</p>
      ) : null}
      {products && products.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-3 max-[339px]:grid-cols-1 xl:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function RecherchePage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm">Recherche…</p>}>
      <RechercheResults />
    </Suspense>
  );
}
