"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, imageUrl } from "@/lib/api";
import { VISUAL_SEARCH_KEY } from "@/lib/visualSearch";

export default function HomeSearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [loadingImage, setLoadingImage] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/recherche?q=${encodeURIComponent(term)}` : "/produits");
  }

  async function onImagePicked(file: File | undefined) {
    if (!file) return;
    setError("");
    setLoadingImage(true);
    try {
      const preview = await shrinkPreview(file);
      const result = await api.searchByImage(file);
      const stored = {
        preview,
        products: result.products,
        keywords: result.keywords,
        image_url: result.image_url ? imageUrl(result.image_url) : preview,
        fallback: result.fallback,
        message: result.message,
      };
      try {
        sessionStorage.setItem(VISUAL_SEARCH_KEY, JSON.stringify(stored));
      } catch {
        sessionStorage.setItem(
          VISUAL_SEARCH_KEY,
          JSON.stringify({ ...stored, preview: "", image_url: result.image_url ? imageUrl(result.image_url) : "" })
        );
      }
      router.push("/produits?visual=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recherche image impossible.");
    } finally {
      setLoadingImage(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <section className="border-b border-black/5 bg-[#f3f3f3]">
      <div className="mx-auto max-w-3xl px-4 py-4 md:px-6 md:py-5">
        <form
          onSubmit={onSubmit}
          className="flex items-center gap-2 rounded-full border border-black/10 bg-white py-1.5 pl-4 pr-1.5 shadow-sm"
          role="search"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 shrink-0 text-brand-black/35"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Je recherche un produit…"
            className="min-w-0 flex-1 bg-transparent py-2 text-sm text-brand-black outline-none placeholder:text-brand-black/40"
            aria-label="Rechercher un produit"
          />
          <button
            type="button"
            aria-label="Recherche vocale"
            onClick={() => {
              type Recognition = { lang: string; start: () => void; onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null };
              const Ctor = (window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }).SpeechRecognition
                || (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition;
              if (!Ctor) {
                setError("La reconnaissance vocale n'est pas disponible sur ce navigateur. Saisissez votre recherche.");
                return;
              }
              const recognition = new Ctor();
              recognition.lang = "fr-FR";
              recognition.onresult = (event) => {
                const transcript = event.results?.[0]?.[0]?.transcript || "";
                if (transcript) router.push(`/recherche?q=${encodeURIComponent(transcript)}`);
              };
              recognition.start();
            }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 text-brand-black"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M6 11a6 6 0 0 0 12 0M12 17v4" />
            </svg>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => onImagePicked(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={loadingImage}
            aria-label="Rechercher par image"
            onClick={() => fileRef.current?.click()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white transition hover:bg-brand-orange-dark disabled:opacity-60"
          >
            {loadingImage ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 7h3l2-2h6l2 2h3v12H4V7Z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
            )}
          </button>
        </form>
        {error && <p className="mt-2 text-center text-xs text-red-600">{error}</p>}
      </div>
    </section>
  );
}

function shrinkPreview(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve("");
    reader.onload = () => {
      const src = String(reader.result || "");
      const img = new Image();
      img.onerror = () => resolve("");
      img.onload = () => {
        const max = 480;
        const scale = Math.min(1, max / Math.max(img.width, img.height, 1));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve("");
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

