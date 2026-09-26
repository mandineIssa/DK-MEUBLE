import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[var(--content-bg-alt)] px-6 py-16 text-center">
      <p
        className="text-sm font-bold uppercase tracking-wider"
        style={{ color: "var(--accent-primary)" }}
      >
        404
      </p>
      <h1 className="mt-2 text-3xl font-extrabold" style={{ color: "var(--text-primary)" }}>
        Page introuvable
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed md:text-base" style={{ color: "var(--text-secondary)" }}>
        Cette page n&apos;existe pas ou a été déplacée. Revenez à l&apos;accueil, parcourez nos
        catégories ou contactez-nous.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-full px-5 py-2.5 text-sm font-bold text-white"
          style={{ background: "var(--accent-primary)" }}
        >
          Accueil
        </Link>
        <Link
          href="/categories"
          className="rounded-full border-2 px-5 py-2.5 text-sm font-bold"
          style={{ borderColor: "var(--text-primary)", color: "var(--text-primary)" }}
        >
          Catégories
        </Link>
        <Link
          href="/produits"
          className="rounded-full border-2 px-5 py-2.5 text-sm font-bold"
          style={{ borderColor: "var(--text-primary)", color: "var(--text-primary)" }}
        >
          Produits
        </Link>
        <Link
          href="/contact"
          className="rounded-full px-5 py-2.5 text-sm font-bold text-white"
          style={{ background: "var(--text-primary)" }}
        >
          Contact
        </Link>
      </div>
    </div>
  );
}
