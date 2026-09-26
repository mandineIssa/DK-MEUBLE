"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  customerApi,
  hasCustomerSession,
  type CustomerNotification,
} from "@/lib/customerApi";

export default function NotificationBell() {
  const pathname = usePathname();
  const router = useRouter();
  const panelId = useId();
  const [loggedIn, setLoggedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<CustomerNotification[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    hasCustomerSession().then(setLoggedIn).catch(() => setLoggedIn(false));
  }, [pathname]);

  useEffect(() => {
    if (!loggedIn) return;
    customerApi
      .getUnreadCount()
      .then((r) => setUnread(r.unread_count))
      .catch(() => setUnread(0));
  }, [loggedIn, pathname]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!loggedIn) return null;

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      try {
        const res = await customerApi.getNotifications({ page: 1 });
        setUnread(res.unread_count);
        setItems(res.data.data || []);
      } catch {
        setItems([]);
      }
    }
  }

  async function onClickItem(n: CustomerNotification) {
    if (!n.is_read) {
      await customerApi.markNotificationRead(n.id).catch(() => {});
      setUnread((u) => Math.max(0, u - 1));
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-primary)] hover:text-[var(--accent-primary)]"
        aria-label="Notifications"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        title="Notifications"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
          <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5" />
          <path d="M9.5 17a2.5 2.5 0 0 0 5 0" />
        </svg>
        {unread > 0 ? (
          <span
            role="status"
            aria-live="polite"
            className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-orange px-1 text-[10px] font-bold text-white"
          >
            <span className="sr-only">{unread} non lues</span>
            <span aria-hidden>{unread > 99 ? "99+" : unread}</span>
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Centre de notifications"
          className="absolute right-0 z-50 mt-2 w-[min(92vw,22rem)] overflow-hidden rounded-2xl border border-black/10 bg-white text-brand-black shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
            <p className="text-sm font-bold">Notifications</p>
            <button
              type="button"
              className="text-xs font-semibold text-brand-orange"
              onClick={() =>
                customerApi.markAllNotificationsRead().then(() => {
                  setUnread(0);
                  setItems((list) => list.map((x) => ({ ...x, is_read: true })));
                })
              }
            >
              Tout lu
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto" aria-live="polite">
            {items.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-brand-black/45">Aucune notification</li>
            ) : (
              items.slice(0, 8).map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => onClickItem(n)}
                    className={`block w-full px-4 py-3 text-left hover:bg-[#f7f7f7] focus:bg-[#f7f7f7] focus:outline-none ${
                      n.is_read ? "" : "bg-brand-orange/5"
                    }`}
                  >
                    <p className="text-sm font-semibold">{n.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-brand-black/55">{n.message}</p>
                    <p className="mt-1 text-[10px] text-brand-black/35">
                      {new Date(n.created_at).toLocaleString("fr-FR")}
                    </p>
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="border-t border-black/5 px-4 py-2">
            <Link
              href="/compte/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-bold text-brand-orange"
            >
              Voir tout
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
