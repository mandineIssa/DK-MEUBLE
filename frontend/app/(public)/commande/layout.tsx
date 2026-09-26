import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  ...NOINDEX_METADATA,
  title: "Commande",
};

export default function CommandeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
