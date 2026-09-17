"use client";

import { FormEvent, useEffect, useState } from "react";

type Review = {
  id: number;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  created_at: string;
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ProductReviews({ slug }: { slug: string }) {
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    const res = await fetch(`${API}/api/products/${slug}/reviews`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = await res.json();
    setAverage(data.average || 0);
    setCount(data.count || 0);
    setReviews(data.reviews || []);
  }

  useEffect(() => {
    load().catch(() => {});
  }, [slug]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`${API}/api/products/${slug}/reviews`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          author_name: author,
          rating,
          title: title || null,
          body,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Impossible d’envoyer l’avis.");
      setMessage(data.message || "Avis envoyé.");
      setBody("");
      setTitle("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
      <div>
        <h2 className="font-bold text-brand-black">Avis clients</h2>
        <p className="text-sm text-brand-black/60">
          {count > 0 ? (
            <>
              {average}/5 · {count} avis
            </>
          ) : (
            "Soyez le premier à donner votre avis"
          )}
        </p>
      </div>

      <ul className="mt-4 space-y-3">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-xl bg-[#f5f5f5] p-4">
            <p className="text-sm font-semibold text-brand-black">
              {r.author_name}{" "}
              <span className="text-brand-orange">
                {"★".repeat(r.rating)}
                {"☆".repeat(5 - r.rating)}
              </span>
            </p>
            {r.title && <p className="mt-1 text-sm font-medium">{r.title}</p>}
            <p className="mt-1 whitespace-pre-line text-sm text-brand-black/70">{r.body}</p>
          </li>
        ))}
      </ul>

      <form onSubmit={onSubmit} className="mt-6 space-y-3 border-t border-black/5 pt-5">
        <p className="text-sm font-semibold text-brand-black">Laisser un avis</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            required
            placeholder="Votre nom"
            className="rounded-xl border border-brand-black/15 px-3 py-2.5 text-sm"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
          <select
            className="rounded-xl border border-brand-black/15 px-3 py-2.5 text-sm"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} étoile{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>
        <input
          placeholder="Titre (optionnel)"
          className="w-full rounded-xl border border-brand-black/15 px-3 py-2.5 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          required
          rows={3}
          placeholder="Votre commentaire…"
          className="w-full rounded-xl border border-brand-black/15 px-3 py-2.5 text-sm"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}
        <button
          type="submit"
          disabled={sending}
          className="rounded-full bg-brand-orange px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {sending ? "Envoi…" : "Publier l’avis"}
        </button>
      </form>
    </section>
  );
}
