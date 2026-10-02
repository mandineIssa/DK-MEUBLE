"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, imageUrl, type Category, type HomepageSlide } from "@/lib/api";

type HeroCopy = {
  headline: string;
  subhead: string;
  body: string;
  primaryLabel: string;
  secondaryLabel: string;
  secondaryHref: string;
  categoriesLabel: string;
};

type Frame = {
  id: string;
  image: string;
  label: string;
  subtitle: string;
  href: string;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function heroCopyFromMeta(meta?: Record<string, unknown> | null): HeroCopy {
  return {
    headline: text(meta?.headline),
    subhead: text(meta?.subhead),
    body: text(meta?.body),
    primaryLabel: text(meta?.primary_label),
    secondaryLabel: text(meta?.secondary_label),
    secondaryHref: text(meta?.secondary_href),
    categoriesLabel: text(meta?.categories_label),
  };
}

export default function HomeHeroSlider({
  slides,
  meta,
}: {
  slides: HomepageSlide[];
  meta?: Record<string, unknown> | null;
}) {
  const copy = heroCopyFromMeta(meta);
  const [index, setIndex] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const frames = useMemo<Frame[]>(
    () =>
      slides
        .filter((slide) => slide.image_desktop)
        .map((slide) => ({
          id: `slide-${slide.id}`,
          image: imageUrl(slide.image_desktop),
          label: slide.title || "",
          subtitle: slide.subtitle || "",
          href: slide.link_url || "",
        })),
    [slides]
  );

  useEffect(() => {
    api
      .getCategories()
      .then((r) => setCategories((r.tree || []).filter((c) => c.is_active !== false).slice(0, 8)))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setIndex(0);
  }, [frames.length]);

  const frame = frames[index] || frames[0];
  const headline = copy.headline;
  const subhead = frame?.subtitle || copy.subhead;
  const showLabel = Boolean(frame?.label && frame.label !== headline);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="relative min-h-[460px] overflow-hidden rounded-3xl bg-[#f3f1ec]">
          {frame ? (
            <Image
              src={frame.image}
              alt={frame.label || headline || "Bannière"}
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 1280px) 100vw, 1200px"
            />
          ) : null}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-black/45 to-transparent" />

          <div className="relative grid min-h-[460px] gap-4 p-4 md:p-6 lg:grid-cols-[230px_1fr]">
            <aside className="hidden self-start rounded-2xl bg-white p-3 text-[#1a1a1a] shadow-lg lg:block">
              {copy.categoriesLabel ? (
                <Link href="/categories" className="mb-2 block rounded-lg px-2 py-2 text-sm font-bold text-brand-orange">
                  {copy.categoriesLabel}
                </Link>
              ) : null}
              <ul className="space-y-1">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link href={`/categorie/${category.slug}`} className="block rounded-lg px-2 py-2 text-sm hover:bg-[#f5f5f5]">
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>

            <div className="flex max-w-xl flex-col justify-center px-2 py-8 text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.45)] md:px-8">
              {showLabel ? (
                <p className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-orange [text-shadow:none]">
                  {frame.label}
                </p>
              ) : null}
              {headline ? <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">{headline}</h1> : null}
              {subhead ? <p className="mt-3 text-lg font-semibold">{subhead}</p> : null}
              {copy.body ? <p className="mt-3 max-w-md text-sm leading-relaxed text-white md:text-base">{copy.body}</p> : null}
              <div className="mt-8 flex flex-wrap gap-3 [text-shadow:none]">
                {copy.primaryLabel ? (
                  <Link href={frame?.href || "/produits"} className="rounded-full bg-brand-orange px-6 py-3 text-sm font-bold text-white">
                    {copy.primaryLabel}
                  </Link>
                ) : null}
                {copy.secondaryLabel && copy.secondaryHref ? (
                  <Link href={copy.secondaryHref} className="rounded-full border border-[#d9d9d9] bg-white px-6 py-3 text-sm font-bold text-[#1a1a1a]">
                    {copy.secondaryLabel}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          {frames.length > 1 ? (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <div className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 shadow-sm">
                {frames.map((item, i) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={item.label || `Slide ${i + 1}`}
                    onClick={() => setIndex(i)}
                    className={`h-2.5 rounded-full bg-[#2b2b2b] transition-all duration-300 ${
                      i === index ? "w-7" : "w-2.5"
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
