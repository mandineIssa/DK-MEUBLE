"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { api, imageUrl, type Product, type Promotion } from "@/lib/api";

/** Une offre affichée dans le carrousel. */
export type PromoSlide = {
  image: string;
  nom: string;
  prixPromo: string;
  prixOriginal: string;
  reduction: string;
  lien: string;
};

const STORAGE_KEY = "dk_promo_popup_closed";
const APPEAR_DELAY_MS = 3000;
const SLIDE_INTERVAL_MS = 4000;

function money(value: number) {
  return `${value.toLocaleString("fr-FR")} FCFA`;
}

function reductionLabel(percent: number, label?: string | null) {
  if (label?.trim()) return label.trim();
  const rounded = Math.round(percent);
  return rounded > 0 ? `-${rounded} %` : "";
}

function fromPromotion(promo: Promotion): PromoSlide | null {
  const product = promo.product;
  const lien = product?.slug ? `/produits/${product.slug}` : "";
  if (!lien || promo.price_promo == null || promo.price_original == null) return null;
  return {
    image: imageUrl(product?.images?.[0]?.path),
    nom: product?.name || "Produit",
    prixPromo: money(promo.price_promo),
    prixOriginal: money(promo.price_original),
    reduction: reductionLabel(promo.discount_percent, promo.discount_label),
    lien,
  };
}

function fromProduct(product: Product): PromoSlide | null {
  const promo = product.effective_price ?? product.promo_price ?? product.price;
  const original = product.compare_at_price;
  if (!product.slug || promo == null || original == null || original <= promo) return null;
  const percent = Math.round((1 - promo / original) * 100);
  return {
    image: imageUrl(product.images?.[0]?.path),
    nom: product.name,
    prixPromo: money(promo),
    prixOriginal: money(original),
    reduction: reductionLabel(percent, product.badge_label),
    lien: `/produits/${product.slug}`,
  };
}

type PromoPopupProps = {
  /** Offres affichées. Vide = le popup ne s’affiche pas. */
  products: PromoSlide[];
  /** Délai avant l’apparition, en millisecondes. */
  delayMs?: number;
};

export function PromoPopup({
  products,
  delayMs = APPEAR_DELAY_MS,
}: PromoPopupProps) {
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (products.length === 0) return;
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      /* navigation privée : on affiche quand même */
    }
    const timer = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [products.length, delayMs]);

  const close = useCallback((event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setVisible(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const goTo = useCallback((next: number) => {
    setIndex(next);
  }, []);

  useEffect(() => {
    if (!visible || products.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % products.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [visible, products.length]);

  if (!visible || products.length === 0) return null;

  return (
    <aside
      role="dialog"
      aria-label="Promotions en cours"
      className="fixed left-3 z-[45] w-[min(18rem,calc(100%-1.5rem))] overflow-hidden rounded-xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.22)] bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px)+var(--vv-bottom,0px))] md:bottom-6 md:left-6 md:w-[min(22rem,calc(100%-1.5rem))]"
    >
      <div className="flex items-center gap-2 bg-brand-orange px-3 py-2 pr-10 text-white">
        <span aria-hidden className="text-base leading-none">
          🏷
        </span>
        <p className="text-xs font-extrabold uppercase tracking-wide">Mega promo • En cours</p>
      </div>

      <button
        type="button"
        onClick={close}
        aria-label="Fermer les promotions"
        className="absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/25 text-sm font-bold text-white hover:bg-black/40"
      >
        ×
      </button>

      <div className="relative h-[168px] sm:h-[268px]">
        {products.map((product, slideIndex) => (
          <div
            key={product.lien}
            role="link"
            tabIndex={slideIndex === index ? 0 : -1}
            onClick={() => router.push(product.lien)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                router.push(product.lien);
              }
            }}
            className={`absolute inset-0 flex cursor-pointer flex-col bg-white transition-opacity duration-500 ${
              slideIndex === index ? "z-[1] opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-hidden={slideIndex !== index}
          >
            <div className="relative h-20 shrink-0 bg-[#f4f4f4] sm:h-[152px]">
              {product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-brand-black/40">Photo à venir</div>
              )}
              {product.reduction ? (
                <span className="absolute left-2 top-2 rounded-md bg-red-600 px-2 py-0.5 text-[11px] font-extrabold text-white">
                  {product.reduction}
                </span>
              ) : null}
            </div>
            <div className="flex flex-1 flex-col justify-center px-3 py-2">
              <p className="line-clamp-2 text-sm font-bold leading-snug text-brand-black">{product.nom}</p>
              <p className="mt-1 text-lg font-extrabold leading-none text-brand-orange">{product.prixPromo}</p>
              <p className="mt-1 text-xs text-brand-black/45 line-through">{product.prixOriginal}</p>
            </div>
          </div>
        ))}
      </div>

      {products.length > 1 ? (
        <div className="flex justify-center gap-1.5 pb-2.5">
          {products.map((product, dotIndex) => (
            <button
              key={product.lien}
              type="button"
              aria-label={`Promotion ${dotIndex + 1}`}
              onClick={() => goTo(dotIndex)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                dotIndex === index ? "w-4 bg-brand-orange" : "w-1.5 bg-brand-black/25"
              }`}
            />
          ))}
        </div>
      ) : null}
    </aside>
  );
}

/** Charge les promotions du catalogue, puis les produits déjà soldés s’il n’y en a pas. */
export default function PromoPopupLoader() {
  const [products, setProducts] = useState<PromoSlide[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const promos = await api.getPromotions({ per_page: "5", sort: "discount" }).catch(() => null);
      let slides = (promos?.data || []).map(fromPromotion).filter((slide): slide is PromoSlide => Boolean(slide));

      if (slides.length === 0) {
        const catalog = await api.getProducts({ per_page: "24" }).catch(() => []);
        slides = catalog.map(fromProduct).filter((slide): slide is PromoSlide => Boolean(slide)).slice(0, 5);
      }

      const unique = slides.filter((slide, i) => slides.findIndex((row) => row.lien === slide.lien) === i);
      if (!cancelled) setProducts(unique.slice(0, 5));
    }

    load().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return <PromoPopup products={products} />;
}
