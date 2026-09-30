import Link from "next/link";
import { api, imageUrl, type Category } from "@/lib/api";
import { homepageBlocks } from "@/lib/homepageBlocks";
import { formatSnPhone } from "@/lib/phone";
import { normalizeMapsEmbedUrl } from "@/lib/site";
import HomeProductCarousel from "@/components/home/HomeProductCarousel";

function flatten(nodes: Category[]): Category[] {
  const out: Category[] = [];
  for (const node of nodes) {
    out.push(node);
    if (node.children?.length) out.push(...flatten(node.children));
  }
  return out;
}

function findByName(list: Category[], pattern: RegExp) {
  return list.find((c) => pattern.test(c.name));
}

/** Vidéo locale par défaut, ou lien YouTube / Facebook / fichier fourni dans les paramètres. */
function storeVideo(url: string): { kind: "file" | "iframe"; src: string } {
  const raw = url.trim();
  if (!raw) return { kind: "file", src: "/visite-magasin.mp4" };
  if (/\.(mp4|webm)(\?|$)/i.test(raw) || raw.startsWith("/")) return { kind: "file", src: raw };
  const yt = raw.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  if (yt) return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${yt[1]}` };
  const vimeo = raw.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return { kind: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}` };
  if (/facebook\.com|fb\.watch/i.test(raw)) {
    return {
      kind: "iframe",
      src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(raw)}&show_text=false`,
    };
  }
  return { kind: "file", src: raw };
}

export default async function HomeVisit({
  excludeProductIds = [],
  showReasons = true,
}: {
  excludeProductIds?: number[];
  showReasons?: boolean;
}) {
  const excluded = new Set(excludeProductIds);
  const [settings, showrooms, services, categories, latest, furnitureHits] = await Promise.all([
    api.getSettings().catch(() => null),
    api.getShowrooms().catch(() => []),
    api.getServices().catch(() => null),
    api.getCategories().catch(() => null),
    api.getProducts({ per_page: "12" }).catch(() => []),
    api.getProducts({ search: "meuble", per_page: "4" }).catch(() => []),
  ]);
  const freshLatest = latest.filter((product) => !excluded.has(product.id)).slice(0, 8);

  const contact = settings?.contact;
  const copy = homepageBlocks(settings);
  const phone = formatSnPhone(contact?.phone_display || contact?.phone_tel || "");
  const showroom = showrooms[0];
  const address = contact?.address || showroom?.address || "";
  const hours = contact?.hours || showroom?.opening_hours || "";
  const mapQuery = [address, showroom?.city].filter(Boolean).join(" ");
  const mapHref = mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : "";
  const embedSrc = normalizeMapsEmbedUrl(String(contact?.maps_embed || "")) || "";

  const allCategories = flatten(categories?.tree || []);
  const furniture = findByName(allCategories, /meuble|armoire|salon|chambre/i);
  const furnitureHref = furniture ? `/categorie/${furniture.slug}` : "/produits?search=meuble";
  const furnitureImage = furniture?.image_path
    ? imageUrl(furniture.image_path)
    : furnitureHits[0]?.images?.[0]
      ? imageUrl(furnitureHits[0].images[0].path)
      : "";

  const serviceList = (services?.services || []).slice(0, 4);
  const video = storeVideo(String(contact?.video_url || ""));
  const poster = String(contact?.video_poster || "").trim() || "/contact-visite-dk-hometech.png";

  return (
    <div>
      {copy.furnitureTitle && (furnitureHits.length > 0 || furniture) ? (
        <section className="mx-auto grid max-w-7xl items-center gap-6 px-4 py-8 md:grid-cols-2 md:px-6">
          <div className="relative min-h-[220px] overflow-hidden rounded-2xl bg-[#f5f5f5]">
            {furnitureImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={furnitureImage} alt={furniture?.name || copy.furnitureTitle} className="absolute inset-0 h-full w-full object-cover" />
            ) : null}
          </div>
          <div>
            {copy.furnitureKicker ? (
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-orange">{copy.furnitureKicker}</p>
            ) : null}
            <h2 className="mt-2 text-3xl font-extrabold text-brand-black">{copy.furnitureTitle}</h2>
            {copy.furnitureText ? <p className="mt-3 text-sm text-brand-black/70">{copy.furnitureText}</p> : null}
            {copy.furnitureCta ? (
              <Link href={furnitureHref} className="mt-5 inline-flex rounded-full bg-brand-orange px-5 py-3 text-sm font-bold text-white">
                {copy.furnitureCta}
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      {freshLatest.length > 0 && copy.latestTitle ? (
        <HomeProductCarousel title={copy.latestTitle} products={freshLatest} bannerLink="/produits" />
      ) : null}

      {showReasons && copy.reasons.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
          {copy.reasonsTitle ? (
            <h2 className="text-2xl font-extrabold text-brand-black md:text-3xl">{copy.reasonsTitle}</h2>
          ) : null}
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {copy.reasons.map((item) => (
              <li key={item} className="rounded-2xl bg-white p-4 text-sm font-semibold text-brand-black shadow-sm">
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {serviceList.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-4 md:px-6">
          {copy.servicesTitle ? <h2 className="text-2xl font-extrabold text-brand-black">{copy.servicesTitle}</h2> : null}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {serviceList.map((service) => (
              <Link key={service.id} href={`/services/${service.slug}`} className="rounded-2xl bg-white p-4 shadow-sm hover:text-brand-orange">
                <p className="font-bold text-brand-black">{service.title}</p>
                {service.short_description ? (
                  <p className="mt-1 line-clamp-3 text-sm text-brand-black/65">{service.short_description}</p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        {copy.visitTitle ? (
          <h2 className="text-2xl font-extrabold text-brand-black md:text-3xl">{copy.visitTitle}</h2>
        ) : null}
        {copy.visitText ? <p className="mt-2 max-w-2xl text-sm text-brand-black/70">{copy.visitText}</p> : null}
        <div className="mt-4 overflow-hidden rounded-2xl bg-black shadow-sm">
          {video.kind === "iframe" ? (
            <iframe
              title={copy.visitTitle || "Visite du magasin"}
              src={video.src}
              className="aspect-video w-full border-0"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              className="aspect-video w-full"
              controls
              playsInline
              preload="metadata"
              poster={poster}
            >
              <source src={video.src} type={video.src.endsWith(".webm") ? "video/webm" : "video/mp4"} />
            </video>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:grid-cols-2 md:px-6">
        <div>
          {copy.aboutTitle ? <h2 className="text-2xl font-extrabold text-brand-black">{copy.aboutTitle}</h2> : null}
          {copy.aboutText ? <p className="mt-3 text-sm leading-relaxed text-brand-black/70">{copy.aboutText}</p> : null}
          {copy.aboutLinkLabel ? (
            <Link href="/a-propos" className="mt-4 inline-flex text-sm font-bold text-brand-orange">
              {copy.aboutLinkLabel}
            </Link>
          ) : null}
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          {copy.contactTitle ? <h2 className="text-xl font-extrabold text-brand-black">{copy.contactTitle}</h2> : null}
          <ul className="mt-3 space-y-2 text-sm text-brand-black/80">
            {address ? <li>Adresse : {address}{showroom?.city ? `, ${showroom.city}` : ""}</li> : null}
            {hours ? <li>Horaires : {hours}</li> : null}
            {phone.display ? (
              <li>
                Téléphone :{" "}
                <a href={`tel:${phone.tel}`} className="font-bold text-brand-orange">
                  {phone.display}
                </a>
              </li>
            ) : null}
            {contact?.email ? <li>E-mail : {contact.email}</li> : null}
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            {copy.contactWriteLabel ? (
              <Link href="/contact" className="rounded-full bg-brand-orange px-4 py-2 text-sm font-bold text-white">
                {copy.contactWriteLabel}
              </Link>
            ) : null}
            {copy.contactShowroomsLabel ? (
              <Link href="/showrooms" className="rounded-full border border-brand-black/15 px-4 py-2 text-sm font-bold">
                {copy.contactShowroomsLabel}
              </Link>
            ) : null}
            {mapHref && copy.contactMapLabel ? (
              <a href={mapHref} target="_blank" rel="noopener noreferrer" className="rounded-full border border-brand-black/15 px-4 py-2 text-sm font-bold">
                {copy.contactMapLabel}
              </a>
            ) : null}
          </div>
          {embedSrc ? (
            <iframe title="Carte DK HOMETECH" src={embedSrc} className="mt-4 h-52 w-full rounded-xl border-0" loading="lazy" />
          ) : null}
        </div>
      </section>
    </div>
  );
}
