import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Déstockage",
  description: "Produits en déstockage — DK MEUBLE",
};

export default async function DestockagePage() {
  const products = await api.getProducts({ clearance: "1", per_page: "48", page: "1" }).catch(() => []);

  return (
    <div className="bg-[#ececec]">
      <section className="bg-brand-black text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
          <p className="text-sm uppercase tracking-wider text-brand-orange">Offres</p>
          <h1 className="mt-2 text-3xl font-extrabold">Déstockage</h1>
          <p className="mt-2 text-white/70">{products.length} produit(s)</p>
          <Link href="/reconditionne" className="mt-3 inline-block text-sm text-brand-orange">
            Voir aussi le reconditionné →
          </Link>
        </div>
      </section>
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-2 md:grid-cols-3 md:px-6 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
        {products.length === 0 && (
          <p className="col-span-full text-center text-brand-black/50">Aucun produit en déstockage.</p>
        )}
      </div>
    </div>
  );
}
