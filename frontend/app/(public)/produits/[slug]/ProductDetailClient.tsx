"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product, imageUrl } from "@/lib/api";
import { useCart } from "@/components/CartProvider";
import { useWaLink } from "@/components/SiteProvider";
import ProductContactActions from "@/components/ProductContactActions";
import ProductReviews from "@/components/ProductReviews";
import FavoriteButton from "@/components/FavoriteButton";
import ReportContentModal from "@/components/ReportContentModal";
import ProductChatButton from "@/components/ProductChatButton";

export default function ProductDetailClient({ product }: { product: Product }) {
  const images = product.images?.length ? product.images : [];
  const [qty, setQty] = useState(1);
  const [cartMsg, setCartMsg] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const { addToCart } = useCart();
  const waHref = useWaLink(`Bonjour, je suis intéressé(e) par ${product.name} (x${qty}).`);
  const cover = images[activeIdx] || images[0];
  const effective = product.effective_price ?? product.price;
  const compare = product.compare_at_price;
  const priceLabel = effective ? `${effective.toLocaleString("fr-FR")} FCFA` : "Sur devis";

  const features = useMemo(() => {
    const list = ["Qualité vérifiée", "Livraison Sénégal", "Conseil magasin"];
    if (product.is_customizable) list.unshift("Personnalisable");
    if (product.condition === "reconditionne") list.unshift("Reconditionné");
    if (product.is_clearance) list.unshift("Déstockage");
    return list;
  }, [product.is_customizable, product.condition, product.is_clearance]);

  async function onAdd() {
    if (effective == null) return;
    try {
      await addToCart(product.id, qty);
      setCartMsg("");
    } catch (err) {
      setCartMsg(err instanceof Error ? err.message : "Erreur");
    }
  }

  return (
    <div className="bg-[#ececec]">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
        <nav className="flex flex-wrap gap-1 text-xs text-brand-black/50">
          <Link href="/">Accueil</Link>
          <span>/</span>
          {product.category?.slug ? (
            <Link href={`/categorie/${product.category.slug}`}>{product.category.name}</Link>
          ) : (
            <Link href="/produits">Produits</Link>
          )}
          <span>/</span>
          <span>{product.name}</span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div>
            <div className="relative min-h-[280px] aspect-square overflow-hidden rounded-2xl bg-white">
              {cover ? (
                <Image
                  src={imageUrl(cover.path)}
                  alt={cover.label || product.name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-brand-black/40">Photo à venir</div>
              )}
              {product.badge_label && (
                <span className="absolute left-3 top-3 rounded-full bg-brand-orange px-3 py-1 text-xs font-bold text-white">
                  {product.badge_label}
                </span>
              )}
              {cover?.label || cover?.role ? (
                <span className="absolute bottom-3 left-3 rounded bg-black/70 px-2 py-1 text-[11px] font-semibold text-white">
                  {cover.label || cover.role}
                </span>
              ) : null}
            </div>
            {images.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setActiveIdx(i)}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                      i === activeIdx ? "border-brand-orange" : "border-transparent"
                    }`}
                    title={img.label || img.role || `Photo ${i + 1}`}
                  >
                    <Image src={imageUrl(img.path)} alt="" fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-orange">
              {product.brand?.name ? `${product.brand.name} · ` : ""}
              {product.category?.name}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold text-brand-black">{product.name}</h1>
            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              <p className="text-2xl font-extrabold text-brand-orange">{priceLabel}</p>
              {compare ? (
                <p className="text-lg text-brand-black/45 line-through">
                  {compare.toLocaleString("fr-FR")} FCFA
                </p>
              ) : null}
            </div>

            <ul className="mt-6 space-y-2">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-brand-black/70">
                  <span className="text-brand-orange">✓</span> {f}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <FavoriteButton productId={product.id} variant="labeled" />
              <ProductChatButton productId={product.id} productName={product.name} />
              <div className="flex items-center gap-2 rounded-full border bg-white px-2">
                <button type="button" className="h-9 w-9" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  −
                </button>
                <span className="w-6 text-center text-sm font-bold">{qty}</span>
                <button type="button" className="h-9 w-9" onClick={() => setQty((q) => q + 1)}>
                  +
                </button>
              </div>
              {effective != null ? (
                <button
                  type="button"
                  onClick={onAdd}
                  className="rounded-full bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Ajouter au panier
                </button>
              ) : (
                <Link
                  href="/devis"
                  className="rounded-full bg-brand-black px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Demander un devis
                </Link>
              )}
              <ProductContactActions productId={product.id} productName={product.name} />
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              <FavoriteButton productId={product.id} />
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="text-sm font-semibold text-brand-black/45 underline-offset-2 hover:text-brand-orange hover:underline"
              >
                Signaler cette annonce
              </button>
            </div>
            <ReportContentModal
              open={reportOpen}
              onClose={() => setReportOpen(false)}
              reportableType="product"
              reportableId={product.id}
              productName={product.name}
            />
            {cartMsg && <p className="mt-2 text-sm text-green-700">{cartMsg}</p>}
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-semibold text-whatsapp"
              >
                WhatsApp
              </a>
            )}

            {product.showrooms && product.showrooms.length > 0 && (
              <div className="mt-8 rounded-2xl bg-white p-4 shadow-sm">
                <h2 className="font-bold">Disponibilité showroom</h2>
                <ul className="mt-2 space-y-1 text-sm">
                  {product.showrooms.map((s) => (
                    <li key={s.id} className="flex justify-between">
                      <span>{s.name}</span>
                      <span className="text-brand-black/55">
                        {s.pivot?.is_available === false ? "Indisponible" : "Dispo"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.description && (
              <div className="mt-8">
                <h2 className="font-bold">Description</h2>
                <p className="mt-2 whitespace-pre-line text-sm text-brand-black/75">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        <ProductReviews slug={product.slug} />
      </div>
    </div>
  );
}
