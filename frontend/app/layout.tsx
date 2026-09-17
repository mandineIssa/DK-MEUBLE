import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DK MEUBLE — Électroménager et meubles à Dakar",
    template: "%s | DK MEUBLE",
  },
  description:
    "Électroménager, meubles et armoires à Dakar depuis +10 ans. Devis gratuit, WhatsApp, livraison partout au Sénégal.",
  keywords: [
    "électroménager Dakar",
    "meubles Sénégal",
    "armoires Dakar",
    "DK MEUBLE",
    "mobilier bureau Dakar",
    "devis électroménager",
  ],
  authors: [{ name: "DK MEUBLE" }],
  openGraph: {
    type: "website",
    locale: "fr_SN",
    url: siteUrl,
    siteName: "DK MEUBLE",
    title: "DK MEUBLE — Électroménager et meubles à Dakar",
    description:
      "Électroménager, meubles et armoires à Dakar. +10 ans d'expérience. Livraison partout au Sénégal.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DK MEUBLE — Électroménager et meubles à Dakar",
    description: "Catalogue, devis WhatsApp, livraison Sénégal.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${montserrat.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
