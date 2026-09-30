"use client";

import { useRouter } from "next/navigation";
import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from "react";

/**
 * Ouvre une fiche produit sans laisser le navigateur afficher l’adresse au survol.
 * Un lien réel reste dans la page pour le référencement, hors de la zone cliquable.
 */
export default function ProductLink({
  href,
  className,
  style,
  children,
  label,
  onNavigate,
}: {
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  label?: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();

  function go(event: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("button")) return;
    onNavigate?.();
    if ("metaKey" in event && (event.metaKey || event.ctrlKey)) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(href);
  }

  const positioned = className?.includes("absolute") ? "" : "relative";

  return (
    <div
      role="link"
      tabIndex={0}
      className={`${positioned} cursor-pointer ${className ?? ""}`}
      style={style}
      onClick={go}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        if ((event.target as HTMLElement).closest("button")) return;
        event.preventDefault();
        go(event);
      }}
    >
      <a href={href} tabIndex={-1} aria-hidden className="pointer-events-none fixed -left-[9999px] h-px w-px overflow-hidden">
        {label || "Voir le produit"}
      </a>
      {children}
    </div>
  );
}
