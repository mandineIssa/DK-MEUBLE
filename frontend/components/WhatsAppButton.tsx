"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSite, useWaLink } from "@/components/SiteProvider";
import { waLink } from "@/lib/site";

export default function WhatsAppButton() {
  const site = useSite();
  const fallback = useWaLink();
  const [href, setHref] = useState<string | null>(fallback);
  const [agentImage, setAgentImage] = useState<string>("");
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    api
      .getHomepage()
      .then((h) => {
        const w = h.whatsapp_widget || {};
        setEnabled(w.enabled !== false);
        setAgentImage(w.agent_image || "");
        const phone = (w.phone || site.whatsapp || "").replace(/\D/g, "");
        const msg = w.message || "Bonjour, je souhaite des informations sur vos produits.";
        setHref(waLink(msg, phone) || fallback);
      })
      .catch(() => setHref(fallback));
  }, [fallback, site.whatsapp]);

  if (!enabled || !href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contacter DK HOMETECH sur WhatsApp"
      className="fixed bottom-6 right-6 z-50 hidden items-center gap-2 md:flex"
    >
      {agentImage ? (
        <span className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white shadow-lg">
          <Image src={agentImage} alt="Conseiller" fill className="object-cover" sizes="48px" />
        </span>
      ) : null}
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg transition-transform hover:scale-105">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.42-1.42a9.9 9.9 0 0 0 4.62 1.17h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2Zm0 18.06h-.01a8.17 8.17 0 0 1-4.16-1.14l-.3-.18-3.1.81.83-3.02-.2-.31a8.13 8.13 0 0 1-1.25-4.31c0-4.5 3.67-8.17 8.19-8.17 2.19 0 4.24.85 5.79 2.4a8.11 8.11 0 0 1 2.39 5.78c0 4.5-3.67 8.14-8.18 8.14Zm4.48-6.1c-.24-.12-1.45-.71-1.68-.8-.22-.08-.39-.12-.55.13-.16.24-.63.79-.78.96-.14.16-.29.18-.53.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.11-.49.11-.11.24-.29.36-.43.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.13 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
        </svg>
      </span>
    </a>
  );
}
