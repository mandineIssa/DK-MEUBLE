"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { customerApi } from "@/lib/customerApi";

const countries = [
  { code: "221", label: "SN +221", flag: "🇸🇳" },
  { code: "33", label: "FR +33", flag: "🇫🇷" },
  { code: "225", label: "CI +225", flag: "🇨🇮" },
];

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dial, setDial] = useState("221");
  const [local, setLocal] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState({ google: false, facebook: false });

  useEffect(() => {
    customerApi.getOAuthProviders().then(setProviders).catch(() => {});
  }, []);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "oauth_config") {
      setError(
        "Connexion Google/Facebook non configurée. Utilisez le téléphone, ou demandez à l’admin d’ajouter les clés OAuth."
      );
    } else if (err === "oauth_failed" || err === "oauth") {
      setError("La connexion sociale a échoué. Réessayez ou utilisez le téléphone.");
    }
  }, [searchParams]);

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
      const res = await customerApi.requestOtp(phone);
      sessionStorage.setItem("dk_otp_phone", phone);
      if (res.debug_code) {
        sessionStorage.setItem("dk_otp_debug", res.debug_code);
      } else {
        sessionStorage.removeItem("dk_otp_debug");
      }
      router.push("/compte/verification");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer le code.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-brand-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-orange";
  const showOAuth = providers.google || providers.facebook;

  return (
    <div className="mx-auto w-full max-w-md">
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-brand-black">Se connecter / Créer un compte</h1>
          <p className="mt-1 text-sm text-brand-black/60">
            Un seul numéro suffit — connexion ou inscription automatique.
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
                if (["Backspace", "Delete", "Tab", "Enter", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand-orange py-3 text-sm font-bold text-white hover:bg-brand-orange-dark disabled:opacity-60"
        >
          {loading ? "Envoi du code…" : "Continuer"}
        </button>

        {showOAuth && (
          <>
            <div className="relative py-2 text-center text-xs text-brand-black/40">
              <span className="bg-white px-2 relative z-10">ou</span>
              <span className="absolute left-0 right-0 top-1/2 h-px bg-brand-black/10" />
            </div>

            {providers.google && (
              <a
                href={customerApi.oauthUrl("google")}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-brand-black/15 py-2.5 text-sm font-semibold text-brand-black hover:bg-[#f7f7f7]"
              >
                Continuer avec Google
              </a>
            )}
            {providers.facebook && (
              <a
                href={customerApi.oauthUrl("facebook")}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-brand-black/15 py-2.5 text-sm font-semibold text-brand-black hover:bg-[#f7f7f7]"
              >
                Continuer avec Facebook
              </a>
            )}
          </>
        )}
      </form>

      <p className="mt-4 text-center text-sm text-brand-black/50">
        <Link href="/" className="font-semibold text-brand-orange">
          ← Retour au site
        </Link>
      </p>
    </div>
  );
}
