"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { useProductInquiry } from "@/components/ProductInquiry";
import { useWaLink } from "@/components/SiteProvider";
import ProductCard from "@/components/ProductCard";
import { aiApi, type AiProduct } from "@/lib/ai";
import type { Product } from "@/lib/api";
import { WHATSAPP_GENERAL_MESSAGE } from "@/lib/whatsappMessage";

const QUICK = [
  "Je cherche des meubles",
  "Je cherche de l'électroménager",
  "Je cherche du mobilier de bureau",
  "Je veux équiper ma maison",
  "Je veux équiper mon entreprise",
];

export default function AiAssistant() {
  const pathname = usePathname();
  const inquiry = useProductInquiry();
  const { addToCart } = useCart();
  const wa = useWaLink(WHATSAPP_GENERAL_MESSAGE);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState("Bonjour 👋 Bienvenue chez DK HOMETECH. Que recherchez-vous aujourd'hui ?");
  const [products, setProducts] = useState<AiProduct[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    aiApi.status().then((status) => {
      if (status && status.assistant_enabled === false) setVisible(false);
    }).catch(() => undefined);
  }, []);

  async function ask(message: string) {
    const clean = message.trim();
    if (!clean || busy) return;
    setBusy(true);
    setText("");
    try {
      const session = localStorage.getItem("dk_ai_session") || undefined;
      const result = await aiApi.chat({
        message: clean,
        session_id: session,
        product_slug: inquiry.product?.slug || undefined,
        page_path: pathname,
      });
      if (result.session_id) localStorage.setItem("dk_ai_session", result.session_id);
      setReply(result.reply);
      setProducts(result.products || []);
    } catch (err) {
      setReply(err instanceof Error ? err.message : "L'assistant est momentanément indisponible. Le catalogue reste accessible.");
      setProducts([]);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    ask(text);
  }

  if (!visible) return null;

  return (
    <div className="fixed right-4 z-40 bottom-[calc(13.5rem+env(safe-area-inset-bottom,0px)+var(--vv-bottom,0px))] md:bottom-24 md:right-6">
      {open ? (
        <div className="mb-3 flex max-h-[70vh] w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="bg-brand-black px-4 py-3 text-white">
            <p className="text-sm font-bold">Assistant DK HOMETECH</p>
            <p className="text-xs text-white/70">Réponses à partir du catalogue. Le message n'est pas envoyé tout seul.</p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            <p className="whitespace-pre-line text-sm text-brand-black">{reply}</p>
            {products.map((product) => (
              <div key={product.id} className="space-y-2">
                <ProductCard product={product as Product} />
                <button
                  type="button"
                  className="text-xs font-bold text-brand-orange"
                  onClick={() => addToCart(product.id, 1).catch(() => undefined)}
                >
                  Ajouter au panier
                </button>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              {QUICK.map((item) => (
                <button key={item} type="button" className="rounded-full bg-[#f6f6f6] px-3 py-1 text-xs font-semibold" onClick={() => ask(item)}>
                  {item}
                </button>
              ))}
              <a href="/suivi" className="rounded-full bg-[#f6f6f6] px-3 py-1 text-xs font-semibold">Suivre ma commande</a>
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#f6f6f6] px-3 py-1 text-xs font-semibold">
                  Contacter DK HOMETECH
                </a>
              ) : null}
            </div>
          </div>
          <form onSubmit={onSubmit} className="flex gap-2 border-t p-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Votre question"
              className="min-w-0 flex-1 rounded-full border px-3 py-2 text-sm"
              aria-label="Message à l'assistant"
            />
            <button type="submit" disabled={busy} className="rounded-full bg-brand-orange px-3 text-sm font-bold text-white disabled:opacity-60">
              {busy ? "…" : "OK"}
            </button>
          </form>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-full bg-brand-black px-4 py-3 text-sm font-bold text-white shadow-lg"
      >
        Assistant DK HOMETECH
      </button>
    </div>
  );
}
