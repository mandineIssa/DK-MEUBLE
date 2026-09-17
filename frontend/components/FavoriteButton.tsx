"use client";

import { useEffect, useState } from "react";
import { customerApi, hasCustomerSession } from "@/lib/customerApi";
import AuthRequiredModal from "@/components/AuthRequiredModal";
import { maybePromptWebPush } from "@/lib/webPush";

const FAVORITE_EVENT = "dk:favorites-changed";

export function emitFavoritesChanged(productId: number, active: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FAVORITE_EVENT, { detail: { productId, active } }));
}

export default function FavoriteButton({
  productId,
  variant = "icon",
}: {
  productId: number;
  variant?: "icon" | "labeled";
}) {
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorToast, setErrorToast] = useState("");
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    hasCustomerSession().then(async (ok) => {
      if (!ok) return;
      try {
        const list = await customerApi.getWishlist();
        setActive(list.some((p) => p.id === productId));
      } catch {
        /* ignore */
      }
    });
  }, [productId]);

  useEffect(() => {
    function onSync(e: Event) {
      const detail = (e as CustomEvent<{ productId: number; active: boolean }>).detail;
      if (detail?.productId === productId) setActive(detail.active);
    }
    window.addEventListener(FAVORITE_EVENT, onSync);
    return () => window.removeEventListener(FAVORITE_EVENT, onSync);
  }, [productId]);

  async function applyToggle(nextActive: boolean) {
    setBusy(true);
    setErrorToast("");
    const prev = active;
    setActive(nextActive);
    emitFavoritesChanged(productId, nextActive);
    try {
      if (nextActive) {
        await customerApi.addWishlist(productId);
        maybePromptWebPush().catch(() => {});
      } else {
        await customerApi.removeWishlist(productId);
      }
    } catch (err) {
      setActive(prev);
      emitFavoritesChanged(productId, prev);
      const message = err instanceof Error ? err.message : "Une erreur est survenue, réessayez";
      if (message.toLowerCase().includes("session")) {
        setAuthOpen(true);
      } else {
        setErrorToast(message);
        setTimeout(() => setErrorToast(""), 3500);
      }
    } finally {
      setBusy(false);
    }
  }

  async function toggle() {
    if (busy) return;
    const ok = await hasCustomerSession();
    if (!ok) {
      setAuthOpen(true);
      return;
    }
    await applyToggle(!active);
  }

  const label = active ? "Retirer des favoris" : "Ajouter aux favoris";

  return (
    <div className="relative inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={toggle}
        aria-pressed={active}
        aria-busy={busy}
        aria-label={label}
        title={label}
        className={`inline-flex items-center justify-center gap-2 rounded-full border transition disabled:opacity-60 ${
          variant === "labeled" ? "h-11 px-4 text-sm font-semibold" : "h-11 w-11"
        } ${
          active
            ? "border-brand-orange bg-brand-orange text-white"
            : "border-brand-black/15 bg-white text-brand-black hover:border-brand-orange hover:text-brand-orange"
        }`}
      >
        {busy ? (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
            aria-hidden
          />
        ) : (
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill={active ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden
          >
            <path d="M12 21s-7-4.6-9.5-9A5.2 5.2 0 0 1 12 5.2 5.2 5.2 0 0 1 21.5 12C19 16.4 12 21 12 21Z" />
          </svg>
        )}
        {variant === "labeled" ? <span>{label}</span> : null}
      </button>

      {errorToast ? (
        <span
          role="alert"
          className="absolute left-0 top-12 z-10 w-56 rounded-lg bg-brand-black px-3 py-2 text-xs font-medium text-white shadow-lg"
        >
          {errorToast}
        </span>
      ) : null}

      <AuthRequiredModal
        open={authOpen}
        title="Connectez-vous pour ajouter aux favoris"
        onClose={() => setAuthOpen(false)}
        onSuccess={async () => {
          await applyToggle(true);
        }}
      />
    </div>
  );
}
