"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { imageUrl } from "@/lib/api";

export type GalleryImage = {
  id: number;
  path: string;
  role?: string | null;
  label?: string | null;
  order?: number;
  display_order?: number;
};

export const IMAGE_ROLES: Array<{ value: string; label: string }> = [
  { value: "cover", label: "Principale" },
  { value: "front", label: "Devant" },
  { value: "back", label: "Arrière" },
  { value: "side", label: "Côté" },
  { value: "left", label: "Côté gauche" },
  { value: "right", label: "Côté droit" },
  { value: "interior", label: "Intérieur" },
  { value: "detail", label: "Détail" },
  { value: "other", label: "Autre" },
];

function roleLabel(role?: string | null) {
  return IMAGE_ROLES.find((r) => r.value === role)?.label || role || "";
}

type Props = {
  images: GalleryImage[];
  uploading?: boolean;
  onUpload: (files: File[], meta: { role?: string; label?: string }) => Promise<void> | void;
  onUpdate?: (id: number, data: { role?: string | null; label?: string | null }) => Promise<void> | void;
  onDelete?: (id: number) => Promise<void> | void;
  onReorder?: (orderedIds: number[]) => Promise<void> | void;
  title?: string;
  hint?: string;
};

export default function AdminMultiImageGallery({
  images,
  uploading,
  onUpload,
  onUpdate,
  onDelete,
  onReorder,
  title = "Photos",
  hint = "Ajoute plusieurs photos (ex. devant, arrière, côté). La première sert de couverture.",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [role, setRole] = useState("cover");
  const [label, setLabel] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    await onUpload(Array.from(files), {
      role: role || undefined,
      label: label.trim() || undefined,
    });
    setLabel("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function move(i: number, dir: -1 | 1) {
    if (!onReorder) return;
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    await onReorder(next.map((img) => img.id));
  }

  return (
    <div className="rounded-xl border border-black/10 bg-[#fafafa] p-3">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-brand-black">{title}</p>
          <p className="text-xs text-brand-black/50">{hint}</p>
        </div>
        <span className="text-xs font-semibold text-brand-black/40">{images.length} photo(s)</span>
      </div>

      {images.length > 0 ? (
        <ul className="mb-3 grid gap-2 sm:grid-cols-2">
          {images.map((img, i) => (
            <li key={img.id} className="flex gap-2 rounded-lg border border-black/5 bg-white p-2">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-[#eee]">
                <Image src={imageUrl(img.path)} alt="" fill className="object-cover" sizes="64px" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <select
                  value={img.role || ""}
                  disabled={!onUpdate || busyId === img.id}
                  onChange={async (e) => {
                    if (!onUpdate) return;
                    setBusyId(img.id);
                    try {
                      await onUpdate(img.id, { role: e.target.value || null, label: img.label });
                    } finally {
                      setBusyId(null);
                    }
                  }}
                  className="w-full rounded border px-1.5 py-1 text-xs"
                >
                  <option value="">Rôle…</option>
                  {IMAGE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  defaultValue={img.label || ""}
                  placeholder="Libellé libre"
                  disabled={!onUpdate || busyId === img.id}
                  onBlur={async (e) => {
                    if (!onUpdate) return;
                    const v = e.target.value.trim();
                    if (v === (img.label || "")) return;
                    setBusyId(img.id);
                    try {
                      await onUpdate(img.id, { role: img.role, label: v || null });
                    } finally {
                      setBusyId(null);
                    }
                  }}
                  className="w-full rounded border px-1.5 py-1 text-xs"
                />
                <div className="flex items-center gap-2 text-[10px]">
                  {i === 0 ? (
                    <span className="font-semibold text-brand-orange">Couverture</span>
                  ) : (
                    <span className="text-brand-black/40">{roleLabel(img.role) || `Photo ${i + 1}`}</span>
                  )}
                  {onReorder ? (
                    <>
                      <button type="button" className="font-bold" onClick={() => move(i, -1)}>
                        ↑
                      </button>
                      <button type="button" className="font-bold" onClick={() => move(i, 1)}>
                        ↓
                      </button>
                    </>
                  ) : null}
                  {onDelete ? (
                    <button
                      type="button"
                      className="ml-auto font-semibold text-red-600"
                      disabled={busyId === img.id}
                      onClick={async () => {
                        if (!confirm("Supprimer cette photo ?")) return;
                        setBusyId(img.id);
                        try {
                          await onDelete(img.id);
                        } finally {
                          setBusyId(null);
                        }
                      }}
                    >
                      Suppr.
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-xs text-brand-black/45">Aucune photo pour le moment.</p>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <label className="text-[11px] font-medium">
          Rôle (nouvelles)
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-0.5 block rounded border px-2 py-1.5 text-xs"
          >
            {IMAGE_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[120px] flex-1 text-[11px] font-medium">
          Libellé (optionnel)
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="ex. Vue salon"
            className="mt-0.5 w-full rounded border px-2 py-1.5 text-xs"
          />
        </label>
        <label className="cursor-pointer rounded-full bg-brand-black px-4 py-2 text-xs font-bold text-white hover:bg-brand-orange">
          {uploading ? "Upload…" : "＋ Ajouter photos"}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>
    </div>
  );
}
