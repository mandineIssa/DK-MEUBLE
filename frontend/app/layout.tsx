import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { siteBaseUrl, SITE_NAME } from "@/lib/seo";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const siteUrl = siteBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_NAME} — Meubles, mobilier de bureau et électroménager à Dakar`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "DK HOMETECH : meubles, armoires, mobilier de bureau et électroménager à Dakar. Conseil, devis et livraison partout au Sénégal.",
  keywords: [
    "DK HOMETECH",
    "dkhometech",
    "DKHOMETECH",
    "dkhometech.sn",
    "meubles Dakar",
    "électroménager Dakar",
    "mobilier de bureau Sénégal",
    "armoires Dakar",
    "livraison Sénégal",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "fr_SN",
    url: siteUrl,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Meubles et électroménager à Dakar`,
    description:
      "Meubles, mobilier de bureau et électroménager à Dakar. Livraison partout au Sénégal.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Meubles et électroménager à Dakar`,
    description: "Catalogue, devis WhatsApp, livraison Sénégal.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  // Pas de canonical global : chaque page définit le sien (évite l’héritage vers l’accueil).
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${montserrat.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
