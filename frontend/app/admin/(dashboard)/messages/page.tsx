"use client";

import { useEffect, useState } from "react";
import { adminApi, ContactMessage } from "@/lib/adminApi";

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      setMessages(await adminApi.getMessages());
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = window.setInterval(() => load(true), 15000);
    return () => window.clearInterval(id);
  }, []);

  async function markRead(id: number) {
    await adminApi.updateMessageStatus(id, "read");
    load();
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-brand-black">Messages de contact</h1>
      <p className="text-sm text-brand-black/60">Formulaire de la page Contact</p>

      <div className="mt-6 space-y-4">
        {loading && <p className="text-brand-black/50">Chargement...</p>}
        {!loading && messages.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center text-brand-black/50 shadow-sm">
            Aucun message pour le moment.
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-brand-black">{m.name}</p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  m.status === "new"
                    ? "bg-[#2B7CFF]/15 text-[#2B7CFF]"
                    : "bg-brand-black/10 text-brand-black/50"
                }`}
              >
                {m.status === "new" ? "Nouveau" : "Lu"}
              </span>
            </div>
            <p className="mt-1 text-sm text-brand-black/60">
              {m.phone}
              {m.email ? ` · ${m.email}` : ""}
            </p>
            <p className="mt-3 whitespace-pre-line rounded-xl bg-[#f5f5f5] p-3 text-sm text-brand-black">
              {m.message}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-brand-black/40">
                Reçu le {new Date(m.created_at).toLocaleDateString("fr-FR")}
              </p>
              {m.status === "new" && (
                <button
                  type="button"
                  onClick={() => markRead(m.id)}
                  className="rounded-full bg-brand-black px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Marquer comme lu
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
