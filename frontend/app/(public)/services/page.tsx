import Link from "next/link";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { api } from "@/lib/api";
import ServiceCard from "@/components/services/ServiceCard";

export const metadata: Metadata = buildPageMetadata({
  title: 'Nos services',
  description:
    'Services DK HOMETECH : installation, réparation et accompagnement à Dakar.',
  path: '/services',
});

export default async function ServicesPage() {
  const data = await api.getServices().catch(() => null);
  const services = data?.services || [];
  const settings = data?.settings || {
    intro_title: "Nos services",
    intro_text: "",
  };

  return (
    <div className="bg-[#f5f5f5] min-h-[60vh]">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <nav className="mb-6 text-sm text-brand-black/55">
          <Link href="/" className="hover:text-brand-orange">
            Accueil
          </Link>
          <span className="mx-2">›</span>
          <span className="font-medium text-brand-black">Services</span>
        </nav>

        <header className="mb-8 max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-black md:text-4xl">
            {settings.intro_title || "Nos services"}
          </h1>
          {settings.intro_text ? (
            <p className="mt-3 text-base text-brand-black/70">{settings.intro_text}</p>
          ) : null}
        </header>

        {services.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-white p-8 text-center text-sm text-brand-black/60">
            Aucun service publié pour le moment.
          </p>
        )}
      </div>
    </div>
  );
}
