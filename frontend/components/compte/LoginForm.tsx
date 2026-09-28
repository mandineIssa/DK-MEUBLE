"use client";

import { FormEvent, MouseEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { customerApi } from "@/lib/customerApi";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_config:
    "La connexion Google / Facebook n’est pas encore activée. Saisissez votre e-mail ou votre téléphone pour recevoir un code.",
  oauth_failed: "La connexion a échoué. Réessayez, ou demandez un code par e-mail ou téléphone.",
  oauth: "Une erreur est survenue. Réessayez, ou demandez un code par e-mail ou téléphone.",
};

export default function LoginForm() {
  const router = useRouter();
  const [loginInput, setLoginInput] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState({ google: false, facebook: false });

  useEffect(() => {
    customerApi.getOAuthProviders().then(setProviders).catch(() => {});

    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err && OAUTH_ERROR_MESSAGES[err]) {
      setInfo(OAUTH_ERROR_MESSAGES[err]);
      params.delete("error");
      const qs = params.toString();
      const next = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
      window.history.replaceState({}, "", next);
    }
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    const value = loginInput.trim();
    const isEmail = value.includes("@");
    setLoading(true);
    try {
      const res = await customerApi.requestOtp(isEmail ? { email: value } : { phone: value });
      const channel = res.channel || (isEmail ? "email" : "phone");
      sessionStorage.setItem("dk_otp_channel", channel);
      if (channel === "email") {
        sessionStorage.setItem("dk_otp_email", res.email || value);
        sessionStorage.removeItem("dk_otp_phone");
      } else {
        sessionStorage.setItem("dk_otp_phone", res.phone || value.replace(/\D/g, ""));
        sessionStorage.removeItem("dk_otp_email");
      }
      if (res.debug_code) sessionStorage.setItem("dk_otp_debug", res.debug_code);
      else sessionStorage.removeItem("dk_otp_debug");
      router.push("/compte/verification");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer le code.");
      setLoading(false);
    }
  }

  function onOAuthClick(provider: "google" | "facebook", e: MouseEvent) {
    if (providers[provider]) return;
    e.preventDefault();
    setError("");
    const label = provider === "google" ? "Google" : "Facebook";
    setInfo(
      `La connexion ${label} n’est pas encore activée. Saisissez votre e-mail ou votre téléphone pour recevoir un code.`
    );
  }

  const inputClass =
    "w-full rounded-xl border border-brand-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-orange";

  const oauthBtnClass =
    "flex w-full items-center justify-center gap-2 rounded-full border border-brand-black/15 py-2.5 text-sm font-semibold text-brand-black hover:bg-[#f7f7f7]";

  return (
    <div className="mx-auto w-full max-w-md">
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-brand-black">Bienvenue chez DK HOMETECH</h1>
          <p className="mt-1 text-sm text-brand-black/60">
            Saisissez votre e-mail ou votre téléphone. Un code vous est envoyé pour ouvrir ou retrouver votre compte.
          </p>
        </div>

        <div>
          <label htmlFor="login" className="mb-1 block text-sm font-medium text-brand-black/70">
            Adresse e-mail ou numéro de téléphone
          </label>
          <input
            id="login"
            value={loginInput}
            onChange={(e) => setLoginInput(e.target.value)}
            autoComplete="username"
            placeholder="exemple@email.com ou 77 000 00 00"
            className={inputClass}
            required
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {info ? (
          <p className="rounded-xl bg-brand-orange/10 px-3 py-2.5 text-sm text-brand-black/80">{info}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand-orange py-3 text-sm font-bold text-white hover:bg-brand-orange-dark disabled:opacity-60"
        >
          {loading ? "Envoi du code…" : "Continuer"}
        </button>

        <div className="relative py-2 text-center text-xs text-brand-black/40">
          <span className="relative z-10 bg-white px-2">Ou connectez-vous avec</span>
          <span className="absolute left-0 right-0 top-1/2 h-px bg-brand-black/10" />
        </div>

        <a
          href={customerApi.oauthUrl("facebook")}
          onClick={(e) => onOAuthClick("facebook", e)}
          className={oauthBtnClass}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#1877F2]" aria-hidden>
            <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H8v3h3v7h3v-7h3l1-3h-4V9c0-.6.4-1 1-1Z" />
          </svg>
          Facebook
        </a>

        <a
          href={customerApi.oauthUrl("google")}
          onClick={(e) => onOAuthClick("google", e)}
          className={oauthBtnClass}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path
              fill="#EA4335"
              d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C17.1 3.1 14.8 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.7H12z"
            />
          </svg>
          Google
        </a>
        <p className="text-center text-xs text-brand-black/45">
          Google ouvre le compte déjà connecté dans le navigateur.
        </p>
      </form>

      <p className="mt-4 text-center text-sm text-brand-black/50">
        <Link href="/" className="font-semibold text-brand-orange">
          ← Retour au site
        </Link>
      </p>
    </div>
  );
}
