"use client";

import { useEffect, useState } from "react";
import { adminApi, getAdminToken } from "@/lib/adminApi";

/**
 * Garde d'auth admin : exige un token Bearer valide avant d'afficher le dashboard.
 */
export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const token = getAdminToken();
      if (!token) {
        window.location.replace("/admin/login");
        return;
      }
      try {
        await adminApi.me();
        if (!cancelled) setReady(true);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Session invalide.");
        // adminApi.me() en 401 redirige déjà ; sinon on force
        if (!window.location.pathname.startsWith("/admin/login")) {
          window.location.replace("/admin/login");
        }
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#ececec] text-sm text-brand-black/60">
        {error || "Vérification de la session…"}
      </div>
    );
  }

  return <>{children}</>;
}
