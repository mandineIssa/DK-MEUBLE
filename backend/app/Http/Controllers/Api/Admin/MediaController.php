<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Media;
use App\Models\Realization;
use App\Models\Service;
use App\Models\Showroom;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    /** @var array<string, class-string<Model>> */
    protected array $map = [
        'categories' => Category::class,
        'brands' => Brand::class,
        'realizations' => Realization::class,
        'services' => Service::class,
        'showrooms' => Showroom::class,
    ];

    /** @var array<string, string> */
    protected array $folders = [
        'categories' => 'categories',
        'brands' => 'brands',
        'realizations' => 'realizations',
        'services' => 'services',
        'showrooms' => 'showrooms',
    ];

    /** @var array<string, string> */
    protected array $coverColumns = [
        'categories' => 'image_path',
        'brands' => 'logo_path',
        'realizations' => 'image_url',
        'services' => 'icon_image',
    ];

    public function index(string $type, int $id): JsonResponse
    {
        $model = $this->resolve($type, $id);

        return response()->json($model->media);
    }

    public function store(Request $request, string $type, int $id): JsonResponse
    {
        $model = $this->resolve($type, $id);
        $data = $request->validate([
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'images' => ['nullable', 'array', 'min:1'],
            'images.*' => ['image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'role' => ['nullable', 'string', 'max:40'],
            'label' => ['nullable', 'string', 'max:120'],
            'roles' => ['nullable', 'array'],
            'roles.*' => ['nullable', 'string', 'max:40'],
            'labels' => ['nullable', 'array'],
            'labels.*' => ['nullable', 'string', 'max:120'],
        ]);

        $files = [];
        if ($request->hasFile('images')) {
            $files = $request->file('images');
        } elseif ($request->hasFile('image')) {
            $files = [$request->file('image')];
        }
        if ($files === []) {
            return response()->json(['message' => 'Aucun fichier image.'], 422);
        }

        $folder = $this->folders[$type];
        $created = [];
        foreach (array_values($files) as $i => $file) {
            $role = $data['roles'][$i] ?? $data['role'] ?? null;
            $label = $data['labels'][$i] ?? $data['label'] ?? null;
            $created[] = $model->addMediaFile($file, $folder, $role, $label);
        }

        $this->syncCover($type, $model);

        return response()->json(count($created) === 1 ? $created[0] : $created, 201);
    }

    public function update(Request $request, Media $medium): JsonResponse
    {
        $data = $request->validate([
            'role' => ['nullable', 'string', 'max:40'],
            'label' => ['nullable', 'string', 'max:120'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ]);
        $medium->update($data);
        $owner = $medium->mediable;
        if ($owner) {
            $type = array_search($owner::class, $this->map, true);
            if ($type) {
                $this->syncCover($type, $owner);
            }
        }

        return response()->json($medium->fresh());
    }

    public function destroy(Media $medium): JsonResponse
    {
        $owner = $medium->mediable;
        Storage::disk('public')->delete($medium->path);
        $medium->delete();
        if ($owner) {
            $type = array_search($owner::class, $this->map, true);
            if ($type) {
                $this->syncCover($type, $owner->fresh());
            }
        }

        return response()->json(['message' => 'Image supprimée.']);
    }

    public function reorder(Request $request, string $type, int $id): JsonResponse
    {
        $model = $this->resolve($type, $id);
        $data = $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['integer'],
        ]);
        foreach ($data['order'] as $i => $mediaId) {
            $model->media()->where('id', $mediaId)->update(['display_order' => $i]);
        }
        $this->syncCover($type, $model);

        return response()->json($model->media()->get());
    }

    protected function resolve(string $type, int $id): Model
    {
        $class = $this->map[$type] ?? null;
        if (! $class || ! method_exists($class, 'media')) {
            abort(404);
        }
        /** @var Model $model */
        $model = $class::query()->findOrFail($id);

        return $model;
    }

    protected function syncCover(string $type, ?Model $model): void
    {
        if (! $model || ! isset($this->coverColumns[$type])) {
            return;
        }
        if (method_exists($model, 'syncCoverFromMedia')) {
            $model->syncCoverFromMedia($this->coverColumns[$type]);
        }
    }
}
