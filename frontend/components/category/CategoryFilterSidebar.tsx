"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

export type CategoryFilterChild = {
  id: number | string;
  name: string;
  slug: string;
  count?: number;
};

export type CategoryFilterNode = {
  id: number | string;
  name: string;
  slug: string;
  count?: number;
  children?: CategoryFilterChild[];
};

export type CategoryFilterSidebarProps = {
  categories: CategoryFilterNode[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  /** exclusive = un seul groupe ouvert ; multiple = plusieurs */
  accordionMode?: "exclusive" | "multiple";
  showSubcategories?: boolean;
  /** Couleur d’accent (case cochée + label) — variable CSS ou hex */
  accentColor?: string;
  title?: string;
  className?: string;
};

function CheckBox({
  checked,
  small,
}: {
  checked: boolean;
  small?: boolean;
}) {
  const size = small ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center border ${size} ${
        checked
          ? "border-[var(--plp-accent)] bg-[var(--plp-accent)]"
          : "border-[#c8c8c8] bg-white"
      }`}
      aria-hidden
    >
      {checked ? (
        <svg viewBox="0 0 12 12" className={small ? "h-2.5 w-2.5 text-white" : "h-3 w-3 text-white"}>
          <path
            d="M2 6.2 4.6 9 10 3.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </span>
  );
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`h-3 w-3 text-[#888] transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export default function CategoryFilterSidebar({
  categories,
  selectedIds,
  onChange,
  accordionMode = "multiple",
  showSubcategories = true,
  accentColor,
  title = "Catégories de produits",
  className = "",
}: CategoryFilterSidebarProps) {
  const [expanded, setExpanded] = useState<string[]>([]);
  const seeded = useRef(false);

  useEffect(() => {
    seeded.current = false;
  }, [categories]);

  useEffect(() => {
    if (seeded.current || !categories.length) return;
    const initial: string[] = [];
    for (const cat of categories) {
      const childHit = (cat.children || []).some((c) => selectedIds.includes(c.slug));
      if (selectedIds.includes(cat.slug) || childHit) {
        initial.push(cat.slug);
      }
    }
    if (initial.length) {
      setExpanded(accordionMode === "exclusive" ? [initial[0]] : initial);
    }
    seeded.current = true;
  }, [categories, selectedIds, accordionMode]);

  function toggleExpand(slug: string) {
    setExpanded((prev) => {
      const isOpen = prev.includes(slug);
      if (accordionMode === "exclusive") {
        return isOpen ? [] : [slug];
      }
      return isOpen ? prev.filter((s) => s !== slug) : [...prev, slug];
    });
  }

  function toggleId(slug: string) {
    onChange(
      selectedIds.includes(slug) ? selectedIds.filter((s) => s !== slug) : [...selectedIds, slug]
    );
  }

  const style: CSSProperties | undefined = accentColor
    ? ({ ["--plp-accent"]: accentColor } as CSSProperties)
    : undefined;

  return (
    <div className={className} style={style}>
      <h4 className="mb-4 text-base font-bold text-[#1a1a1a]">{title}</h4>
      <ul className="space-y-0">
        {categories.map((cat) => {
          const hasChildren = showSubcategories && (cat.children?.length || 0) > 0;
          const isOpen = expanded.includes(cat.slug);
          const checked = selectedIds.includes(cat.slug);

          return (
            <li key={cat.slug} className="border-b border-transparent">
              <div className="flex items-center gap-2 py-2.5">
                <button
                  type="button"
                  onClick={() => toggleId(cat.slug)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                >
                  <CheckBox checked={checked} />
                  <span
                    className={`truncate text-[15px] leading-snug ${
                      checked
                        ? "font-bold text-[var(--plp-accent)]"
                        : "font-normal text-[#2a2a2a]"
                    }`}
                  >
                    {cat.name}
                  </span>
                </button>
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() => toggleExpand(cat.slug)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center"
                    aria-expanded={isOpen}
                    aria-label={isOpen ? "Replier" : "Déplier"}
                  >
                    <ChevronDown open={isOpen} />
                  </button>
                ) : (
                  <span className="h-7 w-7 shrink-0" />
                )}
              </div>

              {hasChildren && isOpen ? (
                <ul className="mb-2 ml-6 space-y-0">
                  {(cat.children || []).map((child) => {
                    const childChecked = selectedIds.includes(child.slug);
                    return (
                      <li key={child.slug}>
                        <button
                          type="button"
                          onClick={() => toggleId(child.slug)}
                          className="flex w-full items-center gap-2 py-1.5 text-left"
                        >
                          <CheckBox checked={childChecked} small />
                          <span
                            className={`text-[13px] leading-snug ${
                              childChecked
                                ? "font-bold text-[var(--plp-accent)]"
                                : "font-normal text-[#444]"
                            }`}
                          >
                            {child.name}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
