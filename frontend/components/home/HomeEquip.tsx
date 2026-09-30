import Link from "next/link";

export default function HomeEquip() {
  return (
    <section className="mx-auto grid max-w-7xl gap-4 px-4 py-8 md:grid-cols-2 md:px-6">
      <Link href="/equipement?mode=maison" className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-orange">Catalogue</p>
        <h2 className="mt-2 text-2xl font-extrabold text-brand-black">Équipez ma maison</h2>
        <p className="mt-2 text-sm text-brand-black/70">Une sélection à partir des produits publiés et de votre budget.</p>
      </Link>
      <Link href="/equipement?mode=bureau" className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-orange">Professionnels</p>
        <h2 className="mt-2 text-2xl font-extrabold text-brand-black">Équipez mon bureau</h2>
        <p className="mt-2 text-sm text-brand-black/70">Bureaux, sièges et rangements disponibles dans le catalogue.</p>
      </Link>
    </section>
  );
}
