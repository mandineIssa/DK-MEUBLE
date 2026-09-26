"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { customerApi } from "@/lib/customerApi";

const countries = [
  { code: "221", label: "SN +221", flag: "🇸🇳" },
  { code: "33", label: "FR +33", flag: "🇫🇷" },
  { code: "225", label: "CI +225", flag: "🇨🇮" },
];

export default function LoginForm() {
  const router = useRouter();
  const [dial, setDial] = useState("221");
  const [local, setLocal] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const digits = local.replace(/\D/g, "");
    if (digits.length < 8) {
      setError("Numéro de téléphone invalide.");
      return;
    }
    const phone = `${dial}${digits}`;
    setLoading(true);
    try {
      const res = await customerApi.requestOtp({ phone });
      sessionStorage.setItem("dk_otp_channel", "phone");
      sessionStorage.setItem("dk_otp_phone", res.phone || phone);
      sessionStorage.removeItem("dk_otp_email");
      if (res.debug_code) sessionStorage.setItem("dk_otp_debug", res.debug_code);
      else sessionStorage.removeItem("dk_otp_debug");
      router.push("/compte/verification");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer le code.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-brand-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-orange";

  return (
    <div className="mx-auto w-full max-w-md">
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-brand-black">Se connecter / Créer un compte</h1>
          <p className="mt-1 text-sm text-brand-black/60">
            Téléphone, Google ou Facebook — connexion et inscription automatiques.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-brand-black/70">Téléphone</label>
          <div className="flex gap-2">
            <select
              value={dial}
              onChange={(e) => setDial(e.target.value)}
              className="w-[7.5rem] shrink-0 rounded-xl border border-brand-black/15 bg-[#f3f3f3] px-2 py-2.5 text-sm font-semibold"
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} +{c.code}
                </option>
              ))}
            </select>
            <input
              value={local}
              onChange={(e) => setLocal(e.target.value.replace(/\D/g, "").slice(0, 15))}
              onKeyDown={(e) => {
                if (e.ctrlKey || e.metaKey || e.altKey) return;
                if (
                  ["Backspace", "Delete", "Tab", "Enter", "ArrowLeft", "ArrowRight", "Home", "End"].includes(
                    e.key
                  )
                )
                  return;
                if (!/^\d$/.test(e.key)) e.preventDefault();
              }}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="tel-national"
              placeholder="770000000"
              className={inputClass}
              required
            />
          </div>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand-orange py-3 text-sm font-bold text-white hover:bg-brand-orange-dark disabled:opacity-60"
        >
          {loading ? "Envoi du code…" : "Continuer"}
        </button>

        <div className="relative py-2 text-center text-xs text-brand-black/40">
          <span className="relative z-10 bg-white px-2">ou continuer avec</span>
          <span className="absolute left-0 right-0 top-1/2 h-px bg-brand-black/10" />
        </div>

        <a
          href={customerApi.oauthUrl("facebook")}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-brand-black/15 py-2.5 text-sm font-semibold text-brand-black hover:bg-[#f7f7f7]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#1877F2]" aria-hidden>
            <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H8v3h3v7h3v-7h3l1-3h-4V9c0-.6.4-1 1-1Z" />
          </svg>
          Facebook
        </a>

        <a
          href={customerApi.oauthUrl("google")}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-brand-black/15 py-2.5 text-sm font-semibold text-brand-black hover:bg-[#f7f7f7]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path
              fill="#EA4335"
              d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C17.1 3.1 14.8 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.7H12z"
            />
          </svg>
          Google
        </a>
      </form>

      <p className="mt-4 text-center text-sm text-brand-black/50">
        <Link href="/" className="font-semibold text-brand-orange">
          ← Retour au site
        </Link>
      </p>
    </div>
  );
}
