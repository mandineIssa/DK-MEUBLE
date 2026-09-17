"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { customerApi } from "@/lib/customerApi";

export default function OtpForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [debugCode, setDebugCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const p = sessionStorage.getItem("dk_otp_phone") || "";
    if (!p) {
      router.replace("/compte/connexion");
      return;
    }
    setPhone(p);
    const dbg = sessionStorage.getItem("dk_otp_debug") || "";
    if (dbg) {
      setDebugCode(dbg);
      setDigits(dbg.split("").slice(0, 6));
    }
  }, [router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function setDigit(index: number, value: string) {
    const v = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = v;
    setDigits(next);
    if (v && index < 5) inputs.current[index + 1]?.focus();
  }

  function onKeyDown(index: number, key: string) {
    if (key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Saisissez les 6 chiffres.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await customerApi.verifyOtp(phone, code);
      sessionStorage.removeItem("dk_otp_phone");
      sessionStorage.removeItem("dk_otp_debug");
      router.push("/compte");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code invalide.");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (cooldown > 0 || !phone) return;
    setError("");
    try {
      const res = await customerApi.requestOtp(phone);
      setCooldown(60);
      if (res.debug_code) {
        sessionStorage.setItem("dk_otp_debug", res.debug_code);
        setDebugCode(res.debug_code);
        setDigits(res.debug_code.split("").slice(0, 6));
      } else {
        sessionStorage.removeItem("dk_otp_debug");
        setDebugCode("");
        setDigits(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du renvoi.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <form onSubmit={onSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-brand-black">Code de vérification</h1>
          <p className="mt-1 text-sm text-brand-black/60">
            Entrez le code à 6 chiffres envoyé au{" "}
            <span className="font-semibold text-brand-black">+{phone}</span>
          </p>
          {debugCode ? (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <span className="font-bold">Mode test</span> — aucun SMS réel.
              Code : <span className="font-mono text-base font-extrabold tracking-widest">{debugCode}</span>
            </p>
          ) : null}
        </div>

        <div className="flex justify-between gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e.key)}
              inputMode="numeric"
              maxLength={1}
              className="h-12 w-10 rounded-xl border border-brand-black/15 text-center text-lg font-bold outline-none focus:border-brand-orange sm:h-14 sm:w-12"
            />
          ))}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-brand-orange py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {loading ? "Vérification…" : "Valider"}
        </button>

        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0}
          className="w-full text-sm font-semibold text-brand-orange disabled:text-brand-black/40"
        >
          {cooldown > 0 ? `Renvoyer le code (${cooldown}s)` : "Renvoyer le code"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        <Link href="/compte/connexion" className="font-semibold text-brand-black/60">
          ← Changer de numéro
        </Link>
      </p>
    </div>
  );
}
