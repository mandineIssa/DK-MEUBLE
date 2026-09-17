"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { customerApi, hasCustomerSession } from "@/lib/customerApi";
import AuthRequiredModal from "@/components/AuthRequiredModal";

type Message = {
  id: number;
  body: string;
  sender_type: "customer" | "admin";
  created_at: string;
};

export default function ProductChatButton({
  productId,
  productName,
}: {
  productId: number;
  productName: string;
}) {
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [chatId, setChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const afterId = useRef(0);

  async function ensureChatAndLoad() {
    const ok = await hasCustomerSession();
    if (!ok) {
      setAuthOpen(true);
      return;
    }
    setOpen(true);
    setError("");
    try {
      const chat = await customerApi.openProductChat(productId);
      setChatId(chat.id);
      const msgs = await customerApi.getProductChatMessages(chat.id);
      setMessages(msgs.data || []);
      afterId.current = msgs.data?.at(-1)?.id || 0;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'ouvrir le chat");
    }
  }

  useEffect(() => {
    if (!open || !chatId) return;
    const t = setInterval(async () => {
      try {
        const msgs = await customerApi.getProductChatMessages(chatId, afterId.current || undefined);
        if (msgs.data?.length) {
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            const next = [...prev];
            for (const m of msgs.data) {
              if (!ids.has(m.id)) next.push(m);
            }
            afterId.current = next.at(-1)?.id || afterId.current;
            return next;
          });
        }
      } catch {
        /* polling soft-fail */
      }
    }, 20000);
    return () => clearInterval(t);
  }, [open, chatId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!chatId || !text.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await customerApi.sendProductChatMessage(chatId, text.trim());
      const incoming = [res, ...(res.auto_replies || [])];
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const next = [...prev];
        for (const m of incoming) {
          if (!ids.has(m.id)) next.push(m);
        }
        afterId.current = next.at(-1)?.id || afterId.current;
        return next;
      });
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={ensureChatAndLoad}
        className="inline-flex items-center gap-2 rounded-full border border-brand-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-brand-black hover:border-brand-orange hover:text-brand-orange"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M4 5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H9l-4 4V5Z" />
        </svg>
        Discuter
      </button>

      <AuthRequiredModal
        open={authOpen}
        title="Connectez-vous pour discuter"
        onClose={() => setAuthOpen(false)}
        onSuccess={async () => {
          await ensureChatAndLoad();
        }}
      />

      {open ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-3 sm:items-center"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Chat — ${productName}`}
            className="flex h-[min(70vh,32rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
              <div>
                <p className="text-sm font-bold">Chat produit</p>
                <p className="text-xs text-brand-black/50 line-clamp-1">{productName}</p>
              </div>
              <button
                type="button"
                className="text-sm font-semibold text-brand-black/45"
                onClick={() => setOpen(false)}
              >
                Fermer
              </button>
            </div>
            <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto bg-[#f7f7f7] px-3 py-3" aria-live="polite">
              {messages.length === 0 ? (
                <p className="py-8 text-center text-sm text-brand-black/45">
                  Posez votre question — un conseiller vous répond.
                </p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      m.sender_type === "customer"
                        ? "ml-auto bg-brand-orange text-white"
                        : "mr-auto bg-white text-brand-black shadow-sm"
                    }`}
                  >
                    {m.body}
                  </div>
                ))
              )}
            </div>
            <form onSubmit={send} className="flex gap-2 border-t border-black/5 p-3">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Votre message…"
                className="flex-1 rounded-full border border-brand-black/15 px-3 py-2 text-sm outline-none focus:border-brand-orange"
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="rounded-full bg-brand-orange px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                Envoyer
              </button>
            </form>
            {error ? <p className="px-3 pb-2 text-xs text-red-600">{error}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
