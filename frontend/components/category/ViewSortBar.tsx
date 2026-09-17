"use client";

import type { CSSProperties } from "react";

export type ViewMode = "grid_2" | "grid_3" | "grid_4" | "list";

export type SortOption = {
  value: string;
  label: string;
  enabled?: boolean;
};

export type ViewSortBarProps = {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  sortOptions: SortOption[];
  currentSort: string;
  onSortChange: (value: string) => void;
  /** Modes activés (admin) */
  enabledViews?: Partial<Record<ViewMode, boolean>>;
  accentColor?: string;
  className?: string;
  /** Compteur optionnel à gauche sur mobile */
  resultLabel?: string;
};

function GridIcon({ mode, active }: { mode: ViewMode; active: boolean }) {
  const color = active ? "var(--plp-accent)" : "#c4c4c4";

  if (mode === "list") {
    return (
      <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
        {[4, 8, 12, 16].map((y) => (
          <rect key={y} x="3" y={y - 1} width="14" height="1.6" rx="0.5" fill={color} />
        ))}
      </svg>
    );
  }

  const cols = mode === "grid_2" ? 2 : mode === "grid_3" ? 3 : 4;
  const gap = mode === "grid_2" ? 4.5 : mode === "grid_3" ? 3.2 : 2.4;
  const size = mode === "grid_2" ? 5.5 : mode === "grid_3" ? 4 : 3;
  const start = (20 - cols * size - (cols - 1) * gap) / 2;

  const dots: Array<{ cx: number; cy: number }> = [];
  for (let r = 0; r < cols; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push({
        cx: start + c * (size + gap) + size / 2,
        cy: start + r * (size + gap) + size / 2,
      });
    }
  }

  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={size / 2} fill={color} />
      ))}
    </svg>
  );
}

const ALL_VIEWS: ViewMode[] = ["grid_2", "grid_3", "grid_4", "list"];

const VIEW_LABELS: Record<ViewMode, string> = {
  grid_2: "Grille 2 colonnes",
  grid_3: "Grille 3 colonnes",
  grid_4: "Grille 4 colonnes",
  list: "Vue liste",
};

export default function ViewSortBar({
  viewMode,
  onViewChange,
  sortOptions,
  currentSort,
  onSortChange,
  enabledViews,
  accentColor,
  className = "",
  resultLabel,
}: ViewSortBarProps) {
  const views = ALL_VIEWS.filter((v) => enabledViews?.[v] !== false);
  const options = sortOptions.filter((o) => o.enabled !== false);
  const currentLabel = options.find((o) => o.value === currentSort)?.label || "Tri par défaut";

  const style: CSSProperties | undefined = accentColor
    ? ({ ["--plp-accent"]: accentColor } as CSSProperties)
    : undefined;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 ${className}`}
      style={style}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {resultLabel ? (
          <p className="text-sm text-[#666] md:hidden">{resultLabel}</p>
        ) : null}
        <div className="hidden items-center gap-1 sm:flex">
          {views.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onViewChange(mode)}
              title={VIEW_LABELS[mode]}
              aria-label={VIEW_LABELS[mode]}
              aria-pressed={viewMode === mode}
              className="flex h-9 w-9 items-center justify-center transition hover:opacity-80"
            >
              <GridIcon mode={mode} active={viewMode === mode} />
            </button>
          ))}
        </div>
        {/* Mobile : dropdown Affichage */}
        <label className="relative sm:hidden">
          <span className="sr-only">Affichage</span>
          <select
            value={viewMode}
            onChange={(e) => onViewChange(e.target.value as ViewMode)}
            className="appearance-none rounded border border-[#ddd] bg-white py-2 pl-3 pr-8 text-sm text-[#333]"
          >
            {views.map((mode) => (
              <option key={mode} value={mode}>
                {VIEW_LABELS[mode]}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#888]">
            ▾
          </span>
        </label>
      </div>

      <label className="relative min-w-[180px] flex-1 sm:max-w-[280px] sm:flex-none">
        <span className="sr-only">Tri</span>
        <select
          value={currentSort}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full appearance-none rounded border border-[#ddd] bg-white py-2.5 pl-4 pr-10 text-sm text-[#333]"
          aria-label={currentLabel}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#888] text-xs">
          ▾
        </span>
      </label>
    </div>
  );
}
