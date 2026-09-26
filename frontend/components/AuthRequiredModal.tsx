"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { customerApi } from "@/lib/customerApi";

const countries = [
  { code: "221", label: "SN +221" },
  { code: "33", label: "FR +33" },
  { code: "225", label: "CI +225" },
];

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

export default function AuthRequiredModal({
  open,
  title = "Connectez-vous pour continuer",
  onClose,
  onSuccess,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [dial, setDial] = useState("221");
  const [local, setLocal] = useState("");
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [debugCode, setDebugCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!open) {
      setStep("phone");
      setError("");
      setDebugCode("");
      setDigits(["", "", "", "", "", ""]);
      return;
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function requestCode(e: FormEvent) {
    e.preventDefault();
    setError("");
    const d = local.replace(/\D/g, "");
    if (d.length < 8) {
      setError("Numéro de téléphone invalide.");
      return;
    }
    const full = `${dial}${d}`;
    setLoading(true);
    try {
      const res = await customerApi.requestOtp({ phone: full });
      setPhone(full);
      setDebugCode(res.debug_code || "");
      if (res.debug_code) {
        setDigits(res.debug_code.split("").slice(0, 6));
      }
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer le code.");
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Saisissez les 6 chiffres.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await customerApi.verifyOtp({ phone, code });
      await onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code invalide.");
    } finally {
      setLoading(false);
    }
  }

  function setDigit(index: number, value: string) {
    const v = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = v;
    setDigits(next);
    if (v && index < 5) inputs.current[index + 1]?.focus();
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-4 sm:items-center"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-required-title"
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="auth-required-title" className="text-lg font-extrabold text-brand-black">
              {title}
            </h2>
            <p className="mt-1 text-sm text-brand-black/55">
              Connexion rapide par SMS — votre action reprendra automatiquement.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-sm font-semibold text-brand-black/50 hover:bg-black/5"
            aria-label="Fermer"
          >
            Échap
          </button>
        </div>

        {step === "phone" ? (
          <form onSubmit={requestCode} className="space-y-3">
            <label className="block text-sm font-medium text-brand-black/70">Téléphone</label>
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
                value={local}
                onChange={(e) => setLocal(e.target.value.replace(/\D/g, "").slice(0, 15))}
                onKeyDown={(e) => {
                  if (e.ctrlKey || e.metaKey || e.altKey) return;
                  if (["Backspace", "Delete", "Tab", "Enter", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
                  if (!/^\d$/.test(e.key)) e.preventDefault();
                }}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="tel-national"
                placeholder="770000000"
                className="w-full rounded-xl border border-brand-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand-orange"
                autoFocus
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-brand-orange py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {loading ? "Envoi…" : "Recevoir le code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-3">
            <p className="text-sm text-brand-black/60">
              Code envoyé au <span className="font-semibold">+{phone}</span>
            </p>
            {debugCode ? (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <span className="font-bold">Mode test</span> — aucun SMS réel.
                Code : <span className="font-mono text-base font-extrabold tracking-widest">{debugCode}</span>
              </p>
            ) : null}
            <div className="flex justify-between gap-2">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputs.current[i] = el;
                  }}
                  value={d}
                  onChange={(e) => setDigit(i, e.target.value)}
                  inputMode="numeric"
                  maxLength={1}
                  className="h-11 w-10 rounded-lg border border-brand-black/15 text-center text-lg font-bold outline-none focus:border-brand-orange"
                  aria-label={`Chiffre ${i + 1}`}
                />
              ))}
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-brand-orange py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {loading ? "Vérification…" : "Valider"}
            </button>
            <button
              type="button"
              className="w-full text-sm font-semibold text-brand-black/50"
              onClick={() => setStep("phone")}
            >
              Changer de numéro
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
