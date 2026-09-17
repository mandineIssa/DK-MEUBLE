import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Showrooms",
  description: "Nos points de vente — DK MEUBLE",
};

export default async function ShowroomsPage() {
  const showrooms = await api.getShowrooms().catch(() => []);

  return (
    <div className="bg-[#ececec]">
      <section className="bg-brand-black text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
          <h1 className="text-3xl font-extrabold">Showrooms</h1>
          <p className="mt-2 text-white/70">Retrouvez-nous en magasin</p>
        </div>
      </section>
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 md:grid-cols-2 md:px-6">
        {showrooms.map((s) => (
          <article key={s.id} className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">{s.name}</h2>
            <p className="mt-2 text-sm text-brand-black/70">{s.address}</p>
            {s.city && <p className="text-sm text-brand-black/50">{s.city}</p>}
            {s.phone && <p className="mt-2 text-sm font-semibold">{s.phone}</p>}
            {s.opening_hours && (
              <p className="mt-2 whitespace-pre-line text-sm text-brand-black/60">{s.opening_hours}</p>
            )}
            {s.latitude && s.longitude ? (
              <a
                href={`https://www.google.com/maps?q=${s.latitude},${s.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-semibold text-brand-orange"
              >
                Voir sur la carte →
              </a>
            ) : null}
          </article>
        ))}
        {showrooms.length === 0 && (
          <p className="text-brand-black/50">Aucun showroom publié.</p>
        )}
      </div>
    </div>
  );
}
