"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import AdminMultiImageGallery, { type GalleryImage } from "@/components/admin/AdminMultiImageGallery";

type EntityType = "categories" | "brands" | "realizations" | "services" | "showrooms";

export default function EntityMediaPanel({
  type,
  entityId,
  title = "Photos",
}: {
  type: EntityType;
  entityId: number;
  title?: string;
}) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const list = await adminApi.getEntityMedia(type, entityId);
      setImages(
        list.map((m) => ({
          id: m.id,
          path: m.path,
          role: m.role,
          label: m.label,
          display_order: m.display_order,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur chargement photos");
    }
  }, [type, entityId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-2">
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <AdminMultiImageGallery
        title={title}
        images={images}
        uploading={uploading}
        onUpload={async (files, meta) => {
          setUploading(true);
          setError("");
          try {
            await adminApi.uploadEntityMedia(type, entityId, files, meta);
            await load();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Échec upload");
          } finally {
            setUploading(false);
          }
        }}
        onUpdate={async (id, data) => {
          await adminApi.updateMedia(id, data);
          await load();
        }}
        onDelete={async (id) => {
          await adminApi.deleteMedia(id);
          await load();
        }}
        onReorder={async (order) => {
          await adminApi.reorderEntityMedia(type, entityId, order);
          await load();
        }}
      />
    </div>
  );
}
