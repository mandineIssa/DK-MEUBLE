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
      <div
        className="rounded-2xl border px-5 py-6"
        style={{
          borderColor: "color-mix(in srgb, var(--accent-primary) 35%, transparent)",
          background: "color-mix(in srgb, var(--accent-primary) 10%, var(--body-bg))",
          color: "var(--text-primary)",
        }}
        role="status"
      >
        <p className="text-base font-extrabold">Message envoyé</p>
        <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Merci ! Nous vous répondrons rapidement par téléphone ou email.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border bg-[var(--body-bg)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--accent-primary)]";
  const inputStyle = { borderColor: "var(--border-light)", color: "var(--text-primary)" };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            className="mb-1.5 block text-sm font-semibold"
            style={{ color: "var(--text-secondary)" }}
            htmlFor="contact-name"
          >
            Nom complet *
          </label>
          <input
            id="contact-name"
            name="name"
            autoComplete="name"
            required
            className={inputClass}
            style={inputStyle}
            placeholder="Votre nom"
          />
        </div>
        <div>
          <label
            className="mb-1.5 block text-sm font-semibold"
            style={{ color: "var(--text-secondary)" }}
            htmlFor="contact-phone"
          >
            Téléphone *
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            className={inputClass}
            style={inputStyle}
            placeholder="77 XXX XX XX"
          />
        </div>
      </div>
      <div>
        <label
          className="mb-1.5 block text-sm font-semibold"
          style={{ color: "var(--text-secondary)" }}
          htmlFor="contact-email"
        >
          Email <span className="font-normal">(optionnel)</span>
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          className={inputClass}
          style={inputStyle}
          placeholder="vous@email.com"
        />
      </div>
      <div>
        <label
          className="mb-1.5 block text-sm font-semibold"
          style={{ color: "var(--text-secondary)" }}
          htmlFor="contact-message"
        >
          Message *
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          className={`${inputClass} resize-y min-h-[120px]`}
          style={inputStyle}
          placeholder="Décrivez votre besoin, un produit ou votre n° de commande…"
        />
      </div>

      {status === "error" ? (
        <p className="text-sm font-medium text-red-600" role="alert">
          {errorMsg}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60 sm:w-auto"
        style={{ background: "var(--accent-primary)" }}
      >
        {status === "sending" ? "Envoi en cours…" : "Envoyer le message"}
      </button>
    </form>
  );
}
