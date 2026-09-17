"use client";

import { useState, FormEvent, useEffect } from "react";
import { api } from "@/lib/api";
import { customerApi, hasCustomerSession } from "@/lib/customerApi";

const types = [
  { id: "frigo", label: "Frigo", emoji: "❄️" },
  { id: "salon", label: "Salon", emoji: "🛋️" },
  { id: "armoire", label: "Armoire", emoji: "🗄️" },
  { id: "bureau", label: "Bureau", emoji: "🖥️" },
  { id: "tv", label: "TV", emoji: "📺" },
  { id: "autre", label: "Autre", emoji: "✨" },
];

export default function QuoteForm({
  productId,
  initialQty = 1,
}: {
  productId?: number;
  initialQty?: number;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [type, setType] = useState("frigo");
  const [qty, setQty] = useState(Math.max(1, initialQty));
  const [prefillName, setPrefillName] = useState("");
  const [prefillPhone, setPrefillPhone] = useState("");

  useEffect(() => {
    hasCustomerSession().then((ok) => {
      if (!ok) return;
      customerApi
        .me()
        .then((p) => {
          setPrefillName(p.name || "");
          setPrefillPhone(p.phone ? p.phone.replace(/^221/, "") : "");
        })
        .catch(() => {});
    });
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "").trim();
    const localPhone = String(form.get("phone") || "").trim();
    const phone = localPhone.startsWith("+") ? localPhone : `+221${localPhone.replace(/\s/g, "")}`;
    const messageBase = String(form.get("message") || "").trim();
    const typeLabel = types.find((t) => t.id === type)?.label || type;
    const message = `[Type: ${typeLabel}] ${messageBase}`.trim();

    if (!name || !localPhone || !messageBase) {
      setStatus("error");
      setErrorMsg("Merci de renseigner votre nom, votre téléphone et votre message.");
      return;
    }

    try {
      await api.sendQuote({
        product_id: productId,
        name,
        phone,
        email: String(form.get("email") || "") || undefined,
        company_name: String(form.get("company_name") || "") || undefined,
        quantity: qty,
        dimensions: String(form.get("dimensions") || "") || undefined,
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
      <div className="rounded-2xl bg-white p-6 text-brand-black shadow-sm">
        Votre demande de devis a bien été envoyée. Notre équipe vous recontacte rapidement par
        téléphone ou WhatsApp.
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-brand-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-orange";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="mb-3 text-sm font-semibold text-brand-black">
          Choisissez ce que vous recherchez
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {types.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={`rounded-2xl border-2 px-2 py-3 text-center transition ${
                type === t.id
                  ? "border-brand-orange bg-brand-orange/10"
                  : "border-transparent bg-white hover:border-brand-orange/40"
              }`}
            >
              <span className="text-2xl">{t.emoji}</span>
              <span className="mt-1 block text-xs font-semibold text-brand-black">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-brand-black/70" htmlFor="name">
            Nom complet *
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={prefillName}
            key={`name-${prefillName}`}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-brand-black/70" htmlFor="phone">
            Votre téléphone *
          </label>
          <div className="flex overflow-hidden rounded-xl border border-brand-black/15 bg-white focus-within:border-brand-orange">
            <span className="flex items-center bg-[#f3f3f3] px-3 text-sm font-semibold text-brand-black">
              +221
            </span>
            <input
              id="phone"
              name="phone"
              required
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="tel-national"
              placeholder="770000000"
              defaultValue={prefillPhone.replace(/\D/g, "")}
              key={`phone-${prefillPhone}`}
              onInput={(e) => {
                const el = e.currentTarget;
                el.value = el.value.replace(/\D/g, "").slice(0, 15);
              }}
              onKeyDown={(e) => {
                if (e.ctrlKey || e.metaKey || e.altKey) return;
                if (["Backspace", "Delete", "Tab", "Enter", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
                if (!/^\d$/.test(e.key)) e.preventDefault();
              }}
              className="w-full border-0 px-3 py-2.5 text-sm outline-none"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-brand-black/70" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-brand-black/70" htmlFor="company_name">
            Entreprise (si applicable)
          </label>
          <input id="company_name" name="company_name" className={inputClass} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div>
          <p className="mb-1 text-sm font-medium text-brand-black/70">Quantité</p>
          <div className="inline-flex items-center rounded-full border border-brand-black/15 bg-white">
            <button type="button" className="px-3 py-2 text-lg font-bold" onClick={() => setQty((q) => Math.max(1, q - 1))}>
              −
            </button>
            <span className="min-w-[2rem] text-center text-sm font-bold">{qty}</span>
            <button type="button" className="px-3 py-2 text-lg font-bold" onClick={() => setQty((q) => q + 1)}>
              +
            </button>
          </div>
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-sm font-medium text-brand-black/70" htmlFor="dimensions">
            Dimensions souhaitées
          </label>
          <input id="dimensions" name="dimensions" placeholder="ex. 2m x 1,5m" className={inputClass} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-brand-black/70" htmlFor="message">
          Votre demande *
        </label>
        <textarea id="message" name="message" required rows={4} className={inputClass} />
      </div>

      {status === "error" && <p className="text-sm text-red-600">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-orange px-5 py-3.5 text-sm font-bold text-white hover:bg-brand-orange-dark disabled:opacity-60 sm:w-auto"
      >
        {status === "sending" ? "Envoi en cours..." : "Envoyer ma demande"}
        <span aria-hidden>✈</span>
      </button>
    </form>
  );
}
