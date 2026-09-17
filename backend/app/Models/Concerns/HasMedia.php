<?php

namespace App\Models\Concerns;

use App\Models\Media;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

trait HasMedia
{
    public function media(): MorphMany
    {
        return $this->morphMany(Media::class, 'mediable')->orderBy('display_order')->orderBy('id');
    }

    public function addMediaFile(UploadedFile $file, string $folder, ?string $role = null, ?string $label = null): Media
    {
        $path = $file->store($folder, 'public');
        $order = (int) $this->media()->count();

        return $this->media()->create([
            'path' => $path,
            'role' => $role,
            'label' => $label,
            'display_order' => $order,
        ]);
    }

    public function deleteMedia(Media $media): void
    {
        if ($media->mediable_type !== static::class || (int) $media->mediable_id !== (int) $this->id) {
            abort(404);
        }
        Storage::disk('public')->delete($media->path);
        $media->delete();
    }

    public function syncCoverFromMedia(string $column = 'image_path'): void
    {
        if (! in_array($column, $this->getFillable(), true)) {
            return;
        }
        $first = $this->media()->orderBy('display_order')->orderBy('id')->first();
        $this->update([$column => $first?->path]);
    }
}
