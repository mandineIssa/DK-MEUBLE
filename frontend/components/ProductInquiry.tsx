"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { WhatsAppProduct } from "@/lib/whatsappMessage";

type InquiryContextValue = {
  product: WhatsAppProduct | null;
  setProduct: (product: WhatsAppProduct | null) => void;
  origin: string;
};

const InquiryContext = createContext<InquiryContextValue>({
  product: null,
  setProduct: () => {},
  origin: "",
});

export function ProductInquiryProvider({ children }: { children: ReactNode }) {
  const [product, setProduct] = useState<WhatsAppProduct | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const value = useMemo(() => ({ product, setProduct, origin }), [product, origin]);

  return <InquiryContext.Provider value={value}>{children}</InquiryContext.Provider>;
}

export function useProductInquiry() {
  return useContext(InquiryContext);
}
