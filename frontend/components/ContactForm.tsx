"use client";

import { useState, FormEvent } from "react";
import { api } from "@/lib/api";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const message = String(form.get("message") || "").trim();

    if (!name || !phone || !message) {
      setStatus("error");
      setErrorMsg("Merci de renseigner votre nom, votre téléphone et votre message.");
      return;
    }

    try {
      await api.sendContact({
        name,
        phone,
        email: String(form.get("email") || "") || undefined,
        message,
      });
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-xl bg-brand-orange/10 p-5 text-brand-black">
        Votre message a bien été envoyé. Nous vous répondrons rapidement.
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-brand-black/15 px-3 py-2.5 text-sm outline-none focus:border-brand-orange";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-brand-black/70" htmlFor="name">
            Nom complet *
          </label>
          <input id="name" name="name" required className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-brand-black/70" htmlFor="phone">
            Téléphone *
          </label>
          <input id="phone" name="phone" required className={inputClass} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-brand-black/70" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-brand-black/70" htmlFor="message">
          Message *
        </label>
        <textarea id="message" name="message" required rows={4} className={inputClass} />
      </div>

      {status === "error" && <p className="text-sm text-red-600">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-full bg-brand-orange px-5 py-3 text-sm font-bold text-white hover:bg-brand-orange-dark disabled:opacity-60"
      >
        {status === "sending" ? "Envoi en cours..." : "Envoyer le message"}
      </button>
    </form>
  );
}
