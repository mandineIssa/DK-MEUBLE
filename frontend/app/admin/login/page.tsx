"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/adminApi";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    if (!email || !password) {
      setError("Merci de renseigner votre email et votre mot de passe.");
      return;
    }

    setLoading(true);
    try {
      await adminApi.login(email, password);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Identifiants incorrects.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-black px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-orange text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M12 3 3 10h2v9h5v-5h4v5h5v-9h2L12 3Z" />
            </svg>
          </span>
          <div>
            <p className="font-bold text-brand-black">
              DK <span className="text-brand-orange">HOMETECH</span>
            </p>
            <p className="text-xs text-brand-black/50">Administration</p>
          </div>
        </div>

        <p className="mt-6 text-sm text-brand-black/70">
          Connectez-vous pour gérer produits, devis et messages.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-black/70" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className="w-full rounded-xl border border-brand-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand-orange"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-black/70" htmlFor="password">
              Mot de passe
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-brand-black/15 px-3 py-2.5 pr-12 text-sm outline-none focus:border-brand-orange"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-brand-black/45 hover:text-brand-orange"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                title={showPassword ? "Masquer" : "Afficher"}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.5 10.7a2.5 2.5 0 003.5 3.5M9.9 5.1A9.8 9.8 0 0112 4.8c5 0 8.7 3.8 10.2 7.2a11.4 11.4 0 01-4.1 4.8M6.1 6.1A11.5 11.5 0 001.8 12c1.5 3.4 5.2 7.2 10.2 7.2 1.3 0 2.5-.2 3.6-.6" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-brand-orange px-4 py-3 text-sm font-bold text-white hover:bg-brand-orange-dark disabled:opacity-60"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
