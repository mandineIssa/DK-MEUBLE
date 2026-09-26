import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import ServiceRequestForm from "@/components/services/ServiceRequestForm";
import ServiceCard from "@/components/services/ServiceCard";
import JsonLd from "@/components/seo/JsonLd";
import { buildBreadcrumbSchema, buildPageMetadata, truncateMeta } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const data = await api.getService(slug);
    return buildPageMetadata({
      title: data.service.meta_title || data.service.title,
      description: truncateMeta(
        data.service.meta_description ||
          data.service.short_description ||
          `${data.service.title} — services DK HOMETECH à Dakar.`
      ),
      path: `/services/${data.service.slug}`,
    });
  } catch {
    return { title: "Service", robots: { index: false, follow: true } };
  }
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await api.getService(slug).catch(() => null);
  if (!data?.service) notFound();

  const { service, settings, siblings } = data;
  const formEnabled = settings?.request_form_enabled !== false;
  const ctaHref = service.cta_link || (formEnabled ? `#demande` : "/contact");

  return (
    <div className="bg-[#f5f5f5] min-h-[60vh]">
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Accueil", path: "/" },
          { name: "Services", path: "/services" },
          { name: service.title, path: `/services/${service.slug}` },
        ])}
      />
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <nav className="mb-6 text-sm text-brand-black/55">
          <Link href="/" className="hover:text-brand-orange">
            Accueil
          </Link>
          <span className="mx-2">›</span>
          <Link href="/services" className="hover:text-brand-orange">
            Services
          </Link>
          <span className="mx-2">›</span>
          <span className="font-medium text-brand-black">{service.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          <article className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-brand-black md:text-4xl">
              {service.title}
            </h1>
            {service.short_description ? (
              <p className="mt-3 text-base text-brand-black/70">{service.short_description}</p>
            ) : null}

            {service.full_content ? (
              <div
                className="prose prose-sm mt-8 max-w-none text-brand-black/80 prose-headings:font-bold prose-a:text-brand-orange"
                dangerouslySetInnerHTML={{ __html: service.full_content }}
              />
            ) : null}

            <div className="mt-8">
              <Link
                href={ctaHref}
                className="inline-flex rounded-full bg-brand-orange px-6 py-3 text-sm font-bold text-white"
              >
                {service.cta_label || "Nous contacter"}
              </Link>
            </div>
          </article>

          <aside className="space-y-4">
            {formEnabled ? (
              <div id="demande" className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-brand-black">Demande de service</h2>
                <p className="mt-1 text-sm text-brand-black/60">
                  Décrivez votre besoin — nous vous recontactons rapidement.
                </p>
                <ServiceRequestForm slug={service.slug} />
              </div>
            ) : (
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold">Besoin d&apos;aide ?</h2>
                <Link href="/contact" className="mt-3 inline-flex text-sm font-semibold text-brand-orange">
                  Aller à la page Contact →
                </Link>
              </div>
            )}
          </aside>
        </div>

        {siblings?.length ? (
          <section className="mt-12">
            <h2 className="mb-4 text-xl font-extrabold text-brand-black">Autres services</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {siblings.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
