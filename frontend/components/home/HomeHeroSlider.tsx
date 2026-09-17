"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { HomepageSlide } from "@/lib/api";

export default function HomeHeroSlider({ slides }: { slides: HomepageSlide[] }) {
  const [index, setIndex] = useState(0);
  const list = slides.length ? slides : [];

  useEffect(() => {
    if (list.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % list.length);
    }, 5500);
    return () => window.clearInterval(id);
  }, [list.length]);

  if (!list.length) return null;

  const slide = list[index] || list[0];
  const desktop = slide.image_desktop || "";
  const mobile = slide.image_mobile || desktop;

  return (
    <section className="relative overflow-hidden">
      <div className="relative min-h-[52vh] md:min-h-[68vh]">
        {desktop ? (
          <>
            <Image
              src={desktop}
              alt={slide.title || "Bannière"}
              fill
              priority
              className="hidden object-cover md:block"
              sizes="100vw"
            />
            <Image
              src={mobile}
              alt={slide.title || "Bannière"}
              fill
              priority
              className="object-cover md:hidden"
              sizes="100vw"
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-brand-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/20" />
        <div className="relative mx-auto flex min-h-[52vh] max-w-7xl flex-col justify-center px-4 py-16 md:min-h-[68vh] md:px-6">
          <div className="max-w-xl">
            {slide.title ? (
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
                {slide.title}
              </h1>
            ) : null}
            {slide.subtitle ? (
              <p className="mt-4 text-base font-medium text-white/90 md:text-lg">{slide.subtitle}</p>
            ) : null}
            {slide.link_url ? (
              <Link
                href={slide.link_url}
                className="mt-8 inline-flex rounded-full bg-brand-orange px-6 py-3 text-sm font-bold text-white"
              >
                Découvrir
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {list.length > 1 ? (
        <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {list.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2.5 w-2.5 rounded-full transition ${
                i === index ? "bg-brand-orange" : "bg-white/50 hover:bg-white"
              }`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
