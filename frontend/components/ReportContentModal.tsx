"use client";

import { FormEvent, useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const REASONS = [
  "Annonce frauduleuse",
  "Mauvaise catégorie",
  "Contenu inapproprié",
  "Doublon",
  "Informations de contact incorrectes",
  "Spam",
];

const countries = [
  { code: "221", label: "SN +221" },
  { code: "33", label: "FR +33" },
  { code: "225", label: "CI +225" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  reportableType: "product" | "product_review";
  reportableId: number;
  productName?: string;
};

export default function ReportContentModal({
  open,
  onClose,
  reportableType,
  reportableId,
  productName,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dial, setDial] = useState("221");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open && !toast) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const isFraud = reason.toLowerCase().includes("fraud");
    if (isFraud && details.trim().length < 10) {
      setError("Un commentaire justificatif est obligatoire pour un signalement de fraude.");
      return;
    }
    const phoneDigits = phoneLocal.replace(/\D/g, "");
    if (name.trim().length < 2) {
      setError("Indiquez votre nom.");
      return;
    }
    if (!email.includes("@")) {
      setError("Email invalide.");
      return;
    }
    if (phoneDigits.length < 8) {
      setError("Téléphone invalide.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${API}/api/content-reports`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          reportable_type: reportableType,
          reportable_id: reportableId,
          reason,
          details: details.trim() || null,
          reporter_name: name.trim(),
          reporter_email: email.trim(),
          reporter_phone: `${dial}${phoneDigits}`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Impossible d'envoyer le signalement.");
      setToast("Votre signalement a été envoyé, merci");
      onClose();
      setTimeout(() => setToast(""), 3500);
      setName("");
      setEmail("");
      setPhoneLocal("");
      setDetails("");
      setReason(REASONS[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 rounded-full bg-brand-black px-4 py-2 text-sm font-semibold text-white shadow-lg"
        >
          {toast}
        </div>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id="report-title" className="text-lg font-extrabold text-brand-black">
                  Signaler {productName ? `« ${productName} »` : "ce contenu"}
                </h2>
                <p className="mt-1 text-sm text-brand-black/55">
                  Notre équipe examine chaque signalement.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-2 py-1 text-sm font-semibold text-brand-black/50 hover:bg-black/5"
              >
                Annuler
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Nom</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-brand-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand-orange"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-brand-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand-orange"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Téléphone</label>
                <div className="flex gap-2">
                  <select
                    value={dial}
                    onChange={(e) => setDial(e.target.value)}
                    className="w-[7.5rem] shrink-0 rounded-xl border border-brand-black/15 bg-[#f3f3f3] px-2 py-2.5 text-sm font-semibold"
                  >
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={phoneLocal}
                    onChange={(e) => setPhoneLocal(e.target.value.replace(/\D/g, "").slice(0, 15))}
                    onKeyDown={(e) => {
                      if (e.ctrlKey || e.metaKey || e.altKey) return;
                      if (["Backspace", "Delete", "Tab", "Enter", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
                      if (!/^\d$/.test(e.key)) e.preventDefault();
                    }}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="tel-national"
                    className="w-full rounded-xl border border-brand-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand-orange"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Raison</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-brand-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand-orange"
                >
                  {REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Commentaire {reason.toLowerCase().includes("fraud") ? "(obligatoire)" : "(optionnel)"}
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-brand-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand-orange"
                />
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-full border border-brand-black/15 py-2.5 text-sm font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 rounded-full bg-brand-orange py-2.5 text-sm font-bold text-white disabled:opacity-60"
                >
                  {sending ? "Envoi…" : "Signaler"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
