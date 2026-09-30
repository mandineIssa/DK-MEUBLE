"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product, imageUrl, type SiteSettings } from "@/lib/api";
import { useCart } from "@/components/CartProvider";
import { useCompare } from "@/components/CompareProvider";
import { useWaLink } from "@/components/SiteProvider";
import { useProductInquiry } from "@/components/ProductInquiry";
import { productWhatsAppMessage } from "@/lib/whatsappMessage";
import ProductContactActions from "@/components/ProductContactActions";
import ProductReviews from "@/components/ProductReviews";
import FavoriteButton from "@/components/FavoriteButton";
import ReportContentModal from "@/components/ReportContentModal";
import ProductChatButton from "@/components/ProductChatButton";
import ProductCard from "@/components/ProductCard";

export default function ProductDetailClient({
  product,
  similarProducts = [],
  reviewAverage = 0,
  reviewCount = 0,
  productPage,
}: {
  product: Product;
  similarProducts?: Product[];
  reviewAverage?: number;
  reviewCount?: number;
  productPage?: SiteSettings["product_page"];
}) {
  const images = product.images?.length ? product.images : [];
  const [qty, setQty] = useState(1);
  const [cartMsg, setCartMsg] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { addToCart } = useCart();
  const compareList = useCompare();
  const router = useRouter();
  const similar = similarProducts;
  const { setProduct, origin } = useProductInquiry();
  const inquiryPrice = product.effective_price ?? product.price;
  const waHref = useWaLink(
    productWhatsAppMessage(
      { name: product.name, sku: product.sku, price: inquiryPrice, slug: product.slug },
      origin
    )
  );

  useEffect(() => {
    setProduct({
      name: product.name,
      sku: product.sku,
      price: inquiryPrice,
      slug: product.slug,
    });
    return () => setProduct(null);
  }, [setProduct, product.name, product.sku, product.slug, inquiryPrice]);
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

  const shownSpecs = useMemo(() => {
    if (!product.specs || typeof product.specs !== "object") return [] as Array<[string, string]>;
    return Object.entries(product.specs)
      .filter(([, value]) => value != null && String(value).trim() !== "")
      .map(([key, value]) => [key, String(value)] as [string, string]);
  }, [product.specs]);
  const description = product.description?.trim() || product.short_description?.trim() || "";
  const discount =
    compare && effective && compare > effective ? Math.round((1 - effective / compare) * 100) : null;
  const stockKnown = product.stock_quantity != null;
  const inStock = stockKnown ? (product.stock_quantity as number) > 0 : false;

  async function onAdd(goCheckout = false) {
    if (effective == null) return;
    try {
      await addToCart(product.id, qty);
      setCartMsg("");
      if (goCheckout) router.push("/commande");
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

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.15fr)_280px]">
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
                    <Image
                      src={imageUrl(img.path)}
                      alt={`${product.name} — photo ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
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
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              {reviewCount > 0 ? (
                <>
                  <span className="font-extrabold text-brand-black">{reviewAverage.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}</span>
                  <span className="text-brand-orange">{"★".repeat(Math.min(5, Math.max(0, Math.round(reviewAverage))))}{"☆".repeat(5 - Math.min(5, Math.max(0, Math.round(reviewAverage))))}</span>
                  <span className="text-brand-black/55">({reviewCount} avis)</span>
                </>
              ) : (
                <span className="text-brand-black/55">Avis sur nos services</span>
              )}
              {stockKnown ? (
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${inStock ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}>
                  {inStock ? "En stock" : "Rupture"}
                </span>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="text-2xl font-extrabold text-brand-orange">{priceLabel}</p>
              {compare ? (
                <p className="text-lg text-brand-black/45 line-through">
                  {compare.toLocaleString("fr-FR")} FCFA
                </p>
              ) : null}
              {discount != null ? (
                <span className="rounded-md bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                  −{discount} %
                </span>
              ) : null}
            </div>
            {shownSpecs.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {shownSpecs.slice(0, 6).map(([key, value]) => (
                  <li key={key} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-black shadow-sm">
                    {key}: {value}
                  </li>
                ))}
              </ul>
            ) : null}

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
                <>
                  <button
                    type="button"
                    onClick={() => onAdd(false)}
                    className="rounded-full bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Ajouter au panier
                  </button>
                  <button
                    type="button"
                    onClick={() => onAdd(true)}
                    className="rounded-full border border-brand-black/15 px-5 py-2.5 text-sm font-semibold"
                  >
                    Acheter maintenant
                  </button>
                </>
              ) : (
                <Link
                  href="/devis"
                  className="rounded-full bg-brand-black px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Demander un devis
                </Link>
              )}
              <ProductContactActions
                productId={product.id}
                productName={product.name}
                sku={product.sku}
                price={inquiryPrice}
                slug={product.slug}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              <FavoriteButton productId={product.id} />
              <button
                type="button"
                onClick={() => compareList.toggle({ id: product.id, slug: product.slug, name: product.name })}
                className="text-sm font-semibold text-brand-black/60"
              >
                {compareList.has(product.id) ? "Retirer de la comparaison" : "Comparer"}
              </button>
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
            {cartMsg && <p className="mt-2 text-sm font-semibold text-red-600">{cartMsg}</p>}
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex rounded-full bg-whatsapp px-5 py-2.5 text-sm font-semibold text-white"
              >
                Demander sur WhatsApp
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

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:hidden">
              <Link href="/livraison" className="rounded-2xl bg-white p-4 text-sm font-bold shadow-sm">
                Livraison
              </Link>
              <Link href="/services" className="rounded-2xl bg-white p-4 text-sm font-bold shadow-sm">
                Installation et services
              </Link>
              <Link href="/paiement" className="rounded-2xl bg-white p-4 text-sm font-bold shadow-sm">
                Moyens de paiement
              </Link>
              <Link href="/retours" className="rounded-2xl bg-white p-4 text-sm font-bold shadow-sm">
                Retours
              </Link>
            </div>
          </div>

          <aside className="space-y-3">
            {productPage?.show_delivery !== false && (productPage?.delivery_line_1 || productPage?.delivery_line_2 || productPage?.delivery_title) ? (
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="font-bold text-brand-black">{productPage?.delivery_title || "Livraison estimée"}</p>
                {productPage?.delivery_line_1 ? <p className="mt-2 text-sm text-brand-black/75">{productPage.delivery_line_1}</p> : null}
                {productPage?.delivery_line_2 ? <p className="text-sm text-brand-black/75">{productPage.delivery_line_2}</p> : null}
                {productPage?.delivery_link_label ? (
                  <Link href="/livraison" className="mt-2 inline-block text-sm font-bold text-brand-orange">
                    {productPage.delivery_link_label}
                  </Link>
                ) : null}
              </div>
            ) : null}
            {productPage?.show_installation !== false && productPage?.installation_text ? (
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="font-bold text-brand-black">{productPage.installation_title || "Installation disponible"}</p>
                <p className="mt-2 text-sm text-brand-black/75">{productPage.installation_text}</p>
                {productPage.installation_link_label ? (
                  <Link href="/services" className="mt-2 inline-block text-sm font-bold text-brand-orange">
                    {productPage.installation_link_label}
                  </Link>
                ) : null}
              </div>
            ) : null}
            {productPage?.show_installment !== false && productPage?.installment_text ? (
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="font-bold text-brand-black">{productPage.installment_title || "Paiement échelonné"}</p>
                <p className="mt-2 text-sm text-brand-black/75">{productPage.installment_text}</p>
                {productPage.installment_link_label ? (
                  <Link href="/paiement" className="mt-2 inline-block text-sm font-bold text-brand-orange">
                    {productPage.installment_link_label}
                  </Link>
                ) : null}
              </div>
            ) : null}
            {productPage?.show_share !== false ? (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="font-bold text-brand-black">{productPage?.share_title || "Partager"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url).then(() => {
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 2000);
                    }).catch(() => {});
                  }}
                  className="rounded-full border border-brand-black/15 px-3 py-1.5 text-xs font-bold"
                >
                  {copied ? "Lien copié" : "Copier le lien"}
                </button>
                {waHref ? (
                  <a href={waHref} target="_blank" rel="noopener noreferrer" className="rounded-full bg-whatsapp px-3 py-1.5 text-xs font-bold text-white">
                    WhatsApp
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank", "noopener,noreferrer")}
                  className="rounded-full bg-[#1877F2] px-3 py-1.5 text-xs font-bold text-white"
                >
                  Facebook
                </button>
                <button
                  type="button"
                  onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(product.name)}`, "_blank", "noopener,noreferrer")}
                  className="rounded-full bg-brand-black px-3 py-1.5 text-xs font-bold text-white"
                >
                  X
                </button>
              </div>
            </div>
            ) : null}
          </aside>
        </div>

        <section className="mt-10 rounded-2xl bg-white p-4 shadow-sm md:p-6">
          <div className="flex gap-4 overflow-x-auto border-b border-black/10 text-sm font-semibold">
            {[
              ["description", "Description"],
              ["caracteristiques", "Caractéristiques techniques"],
              ["avis", "Avis clients"],
              ["similaires", "Produits similaires"],
            ].map(([id, label]) => (
              <a key={id} href={`#${id}`} className="shrink-0 border-b-2 border-transparent px-1 pb-3 text-brand-black/70 hover:border-brand-orange hover:text-brand-black">
                {label}
              </a>
            ))}
          </div>

          <div className={`mt-6 grid gap-6 ${description && shownSpecs.length > 0 ? "lg:grid-cols-2" : ""}`}>
            {description ? (
              <div id="description">
                <h2 className="mb-2 font-bold text-brand-black">Description</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-brand-black/75">{description}</p>
              </div>
            ) : (
              <div id="description" />
            )}

            {shownSpecs.length > 0 ? (
              <div id="caracteristiques" className="rounded-2xl border border-black/5 p-4">
                <h2 className="mb-3 font-bold text-brand-black">Caractéristiques techniques</h2>
                <dl className="divide-y divide-black/5 text-sm">
                  {shownSpecs.map(([key, value]) => (
                    <div key={key} className="grid grid-cols-[1fr_auto] gap-3 py-2">
                      <dt className="text-brand-black/70">{key}</dt>
                      <dd className="font-semibold text-brand-black">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <div id="caracteristiques" />
            )}
          </div>
        </section>

        <div id="avis">
          <ProductReviews slug={product.slug} samples={productPage?.reviews} />
        </div>

        <section id="similaires" className="mx-auto mt-10 max-w-7xl">
          <h2 className="text-xl font-extrabold">Vous pourriez également aimer</h2>
          {similar.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {similar.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-brand-black/60">Aucun autre produit à proposer pour le moment.</p>
          )}
        </section>
      </div>
      {effective != null ? (
        <div className="fixed inset-x-0 z-30 flex gap-2 border-t bg-white p-3 md:hidden bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px)+var(--vv-bottom,0px))]">
          <button type="button" onClick={() => onAdd(false)} className="flex-1 rounded-full bg-brand-orange py-3 text-sm font-bold text-white">
            Ajouter au panier
          </button>
          <button type="button" onClick={() => onAdd(true)} className="rounded-full border border-brand-black/15 px-4 py-3 text-sm font-bold">
            Acheter
          </button>
        </div>
      ) : null}
    </div>
  );
}
