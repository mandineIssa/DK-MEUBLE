import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#ececec] px-6 text-center">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-orange">404</p>
      <h1 className="mt-2 text-3xl font-extrabold text-brand-black">Page introuvable</h1>
      <p className="mt-3 max-w-md text-brand-black/65">
        Cette page n&apos;existe pas ou a été déplacée. Revenez à l&apos;accueil ou parcourez nos
        produits.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-brand-orange px-5 py-2.5 text-sm font-bold text-white"
        >
          Accueil
        </Link>
        <Link
          href="/produits"
          className="rounded-full border-2 border-brand-black px-5 py-2.5 text-sm font-bold text-brand-black"
        >
          Voir les produits
        </Link>
        <Link
          href="/contact"
          className="rounded-full bg-brand-black px-5 py-2.5 text-sm font-bold text-white"
        >
          Contact
        </Link>
      </div>
    </div>
  );
}
