import Link from "next/link";

export default function ConfirmationPage({
  searchParams,
}: {
  searchParams: { ref?: string };
}) {
  const ref = searchParams.ref || "";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-3xl font-extrabold text-brand-black">Merci !</h1>
      <p className="mt-3 text-brand-black/70">Votre commande a bien été enregistrée.</p>
      {ref && (
        <p className="mt-4 rounded-2xl bg-white p-4 text-lg font-bold shadow-sm">
          N° {ref}
        </p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/produits" className="rounded-full bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white">
          Continuer vos achats
        </Link>
        <Link href="/compte" className="rounded-full border px-5 py-2.5 text-sm font-semibold">
          Mon compte
        </Link>
      </div>
    </div>
  );
}
