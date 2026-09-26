import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  ...NOINDEX_METADATA,
  title: "Panier",
};

export default function PanierLayout({ children }: { children: React.ReactNode }) {
  return children;
}
