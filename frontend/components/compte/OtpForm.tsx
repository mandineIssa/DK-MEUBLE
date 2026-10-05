"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { customerApi } from "@/lib/customerApi";
import OtpDigits from "@/components/compte/OtpDigits";

type Channel = "phone" | "email";

export default function OtpForm() {
  const router = useRouter();
  const [channel, setChannel] = useState<Channel>("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [debugCode, setDebugCode] = useState("");

  useEffect(() => {
    const ch = (sessionStorage.getItem("dk_otp_channel") || "phone") as Channel;
    const p = sessionStorage.getItem("dk_otp_phone") || "";
    const e = sessionStorage.getItem("dk_otp_email") || "";
    setDebugCode(sessionStorage.getItem("dk_otp_debug") || "");

    if (ch === "email" && !e) {
      router.replace("/compte/connexion");
      return;
    }
    if (ch !== "email" && !p) {
      router.replace("/compte/connexion");
      return;
    }

    setChannel(ch === "email" ? "email" : "phone");
    setPhone(p);
    setEmail(e);
  }, [router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function clearSession() {
    sessionStorage.removeItem("dk_otp_phone");
    sessionStorage.removeItem("dk_otp_email");
    sessionStorage.removeItem("dk_otp_channel");
    sessionStorage.removeItem("dk_otp_debug");
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
      if (channel === "email") {
        await customerApi.verifyOtp({ email, code });
      } else {
        await customerApi.verifyOtp({ phone, code });
      }
      clearSession();
      router.push("/compte");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code invalide.");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (cooldown > 0) return;
    setError("");
    try {
      const res = channel === "email"
        ? await customerApi.requestOtp({ email })
        : await customerApi.requestOtp({ phone });
      if (res.debug_code) {
        sessionStorage.setItem("dk_otp_debug", res.debug_code);
        setDebugCode(res.debug_code);
      } else {
        sessionStorage.removeItem("dk_otp_debug");
        setDebugCode("");
      }
      setCooldown(60);
      setDigits(["", "", "", "", "", ""]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du renvoi.");
    }
  }

  const targetLabel =
    channel === "email" ? (
      <span className="font-semibold text-brand-black">{email}</span>
    ) : (
      <span className="font-semibold text-brand-black">+{phone}</span>
    );

  return (
    <div className="mx-auto w-full max-w-md">
      <form onSubmit={onSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-brand-black">Code de vérification</h1>
          <p className="mt-1 text-sm text-brand-black/60">
            Entrez le code à 6 chiffres envoyé {channel === "email" ? "à" : "au"} {targetLabel}
          </p>
        </div>

        <OtpDigits digits={digits} onChange={setDigits} />
        <p className="text-center text-xs text-brand-black/45">Copiez le code reçu, puis collez-le ici.</p>

        {debugCode ? (
          <p className="rounded-xl bg-[#f7f7f7] px-3 py-2 text-xs text-brand-black/70">
            Code de test (environnement local) : {debugCode}
          </p>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

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
          ← Changer de méthode
        </Link>
      </p>
    </div>
  );
}
