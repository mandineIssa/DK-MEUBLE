"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const VISITOR_KEY = "dk_vid";
const SESSION_KEY = "dk_sid";
const SESSION_TTL_MS = 30 * 60 * 1000;

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = uid("v");
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return uid("v");
  }
}

function getSessionId() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const now = Date.now();
    if (raw) {
      const parsed = JSON.parse(raw) as { id: string; at: number };
      if (parsed?.id && now - parsed.at < SESSION_TTL_MS) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: parsed.id, at: now }));
        return parsed.id;
      }
    }
    const id = uid("s");
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id, at: now }));
    return id;
  } catch {
    return uid("s");
  }
}

function detectDevice(): "desktop" | "mobile" | "tablet" {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

/** Anti-spam pageview même si le composant est remonté (Suspense / HMR). */
let lastTrackedPath = "";
let lastTrackedAt = 0;

export default function VisitTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams?.toString() || "";

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const full = qs ? `${pathname}?${qs}` : pathname;
    const now = Date.now();
    // Ignore doublons / remounts dans les 2 s
    if (lastTrackedPath === full && now - lastTrackedAt < 2000) return;
    lastTrackedPath = full;
    lastTrackedAt = now;

    const params = new URLSearchParams(qs);
    const payload = {
      path: pathname,
      title: typeof document !== "undefined" ? document.title : "",
      referrer: typeof document !== "undefined" ? document.referrer || "" : "",
      utm_source: params.get("utm_source") || undefined,
      utm_medium: params.get("utm_medium") || undefined,
      utm_campaign: params.get("utm_campaign") || undefined,
      session_id: getSessionId(),
      visitor_id: getVisitorId(),
      device: detectDevice(),
    };

    const ctrl = new AbortController();
    const t = window.setTimeout(() => {
      fetch(`${API_URL}/api/analytics/pageview`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
        signal: ctrl.signal,
      }).catch(() => {
        /* ignore */
      });
    }, 200);

    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
  }, [pathname, qs]);

  return null;
}
