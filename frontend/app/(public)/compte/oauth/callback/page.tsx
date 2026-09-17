"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setCustomerToken } from "@/lib/customerApi";
import { Suspense } from "react";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    const error = params.get("error");
    if (error || !token) {
      router.replace("/compte/connexion?error=oauth");
      return;
    }
    setCustomerToken(token)
      .then(() => router.replace("/compte"))
      .catch(() => router.replace("/compte/connexion?error=oauth"));
  }, [params, router]);

  return (
    <p className="py-20 text-center text-sm text-brand-black/60">Connexion en cours…</p>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<p className="py-20 text-center text-sm">Chargement…</p>}>
      <CallbackInner />
    </Suspense>
  );
}
