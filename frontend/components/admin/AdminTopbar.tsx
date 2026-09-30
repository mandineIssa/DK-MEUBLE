"use client";

import { usePathname } from "next/navigation";

const SECTIONS: Array<{ href: string; title: string; hint: string }> = [
  { href: "/admin/produits", title: "Produits", hint: "Fiches visibles sur le site" },
  { href: "/admin/categories", title: "Catégories", hint: "Rayons du catalogue" },
  { href: "/admin/listing", title: "Pages catégorie", hint: "Filtres et tri vus par le client" },
  { href: "/admin/navigation", title: "Menu", hint: "Liens du haut du site" },
  { href: "/admin/footer", title: "Pied de page", hint: "Contacts et liens du bas" },
  { href: "/admin/theme", title: "Apparence", hint: "Couleurs du site" },
  { href: "/admin/marques", title: "Marques", hint: "Marques des fiches produit" },
  { href: "/admin/showrooms", title: "Magasins", hint: "Points de retrait et visite" },
  { href: "/admin/commandes/reglages", title: "Commandes", hint: "Règles du tunnel d’achat" },
  { href: "/admin/commandes", title: "Commandes", hint: "Achats à préparer et livrer" },
  { href: "/admin/livraison", title: "Livraison", hint: "Frais et délais par zone" },
  { href: "/admin/realisations", title: "Réalisations", hint: "Photos de chantiers" },
  { href: "/admin/services/demandes", title: "Demandes de service", hint: "Clients qui ont demandé une prestation" },
  { href: "/admin/services", title: "Services", hint: "Installation, SAV et prestations" },
  { href: "/admin/accueil", title: "Page d’accueil", hint: "Bandeau et blocs de l’accueil" },
  { href: "/admin/contenu", title: "Pages du site", hint: "Textes à propos, livraison, retours" },
  { href: "/admin/devis-b2b", title: "Devis entreprises", hint: "Plusieurs produits dans un même devis" },
  { href: "/admin/devis", title: "Devis", hint: "Demandes envoyées depuis une fiche" },
  { href: "/admin/entreprises", title: "Entreprises", hint: "Comptes professionnels" },
  { href: "/admin/factures", title: "Factures", hint: "Factures des devis entreprises" },
  { href: "/admin/avis", title: "Avis", hint: "Notes à publier ou masquer" },
  { href: "/admin/campagnes", title: "Campagnes", hint: "Messages envoyés aux clients" },
  { href: "/admin/promotions/reglages", title: "Promotions", hint: "Règles des réductions" },
  { href: "/admin/promotions", title: "Promotions", hint: "Prix barrés affichés au client" },
  { href: "/admin/messages", title: "Messages", hint: "Écrits depuis la page Contact" },
  { href: "/admin/newsletter", title: "Newsletter", hint: "Personnes inscrites aux offres" },
  { href: "/admin/notifications", title: "Notifications", hint: "Alertes envoyées aux clients" },
  { href: "/admin/clients", title: "Clients", hint: "Comptes créés sur le site" },
  { href: "/admin/favoris", title: "Favoris", hint: "Produits mis de côté" },
  { href: "/admin/visites", title: "Visites", hint: "Fréquentation et provenance" },
  { href: "/admin/parametres", title: "Paramètres", hint: "Logo, téléphone et réseaux" },
  { href: "/admin", title: "Tableau de bord", hint: "Ce qui demande une action" },
];

export default function AdminTopbar() {
  const pathname = usePathname();
  const section =
    SECTIONS.find((item) => (item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href))) ??
    SECTIONS[SECTIONS.length - 1];

  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-black/5 bg-white px-6 py-3">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">Administration</p>
        <p className="truncate text-base font-extrabold text-brand-black">{section.title}</p>
        <p className="truncate text-xs text-brand-black/50">{section.hint}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden text-sm font-medium text-brand-black sm:inline">Admin</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-orange text-sm font-bold text-white">
          A
        </span>
      </div>
    </header>
  );
}
