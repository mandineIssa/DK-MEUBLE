<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductAttributeValue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $light = $request->boolean('light');
        $query = Product::query()->latest();

        if ($q = trim((string) $request->query('q', ''))) {
            $query->where(function ($w) use ($q) {
                $w->where('name', 'like', "%{$q}%")
                    ->orWhere('sku', 'like', "%{$q}%")
                    ->orWhere('slug', 'like', "%{$q}%");
            });
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($light) {
            $query->select(['id', 'category_id', 'brand_id', 'name', 'slug', 'price', 'promo_price', 'status', 'stock_quantity']);
            $perPage = min(200, max(1, (int) $request->query('per_page', 100)));
            if ($request->boolean('all')) {
                return response()->json($query->limit(500)->get());
            }

            return response()->json($query->paginate($perPage));
        }

        $query->with([
            'category:id,name,slug',
            'images' => fn ($q) => $q->orderBy('order')->limit(3),
            'brand:id,name,slug',
        ]);

        $perPage = min(100, max(1, (int) $request->query('per_page', 50)));

        return response()->json($query->paginate($perPage));
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']).'-'.Str::random(4);
        $attrs = $data['attribute_values'] ?? [];
        unset($data['attribute_values'], $data['showroom_stocks']);

        $product = Product::create($data);
        $this->syncAttributes($product, $attrs);
        $this->syncShowrooms($product, $request->input('showroom_stocks', []));
        app(\App\Services\CategoryService::class)->forgetTreeCache();

        return response()->json($product->load(['category', 'images', 'brand', 'attributeValues', 'showrooms']), 201);
    }

    public function update(StoreProductRequest $request, Product $product): JsonResponse
    {
        $data = $request->validated();
        $attrs = $data['attribute_values'] ?? null;
        unset($data['attribute_values'], $data['showroom_stocks']);
        $product->update($data);
        if (is_array($attrs)) {
            $this->syncAttributes($product, $attrs);
        }
        if ($request->has('showroom_stocks')) {
            $this->syncShowrooms($product, $request->input('showroom_stocks', []));
        }
        app(\App\Services\CategoryService::class)->forgetTreeCache();

        return response()->json($product->fresh()->load(['category', 'images', 'brand', 'attributeValues', 'showrooms']));
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();
        app(\App\Services\CategoryService::class)->forgetTreeCache();

        return response()->json(['message' => 'Produit supprimé.']);
    }

    public function storeImage(Product $product, Request $request): JsonResponse
    {
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

        $created = [];
        foreach (array_values($files) as $i => $file) {
            $path = $file->store('products', 'public');
            $created[] = $product->images()->create([
                'path' => $path,
                'role' => $data['roles'][$i] ?? $data['role'] ?? null,
                'label' => $data['labels'][$i] ?? $data['label'] ?? null,
                'order' => $product->images()->count(),
            ]);
        }

        return response()->json(count($created) === 1 ? $created[0] : $created, 201);
    }

    public function updateImage(Request $request, Product $product, int $image): JsonResponse
    {
        $img = $product->images()->where('id', $image)->firstOrFail();
        $data = $request->validate([
            'role' => ['nullable', 'string', 'max:40'],
            'label' => ['nullable', 'string', 'max:120'],
            'order' => ['nullable', 'integer', 'min:0'],
        ]);
        $img->update($data);

        return response()->json($img->fresh());
    }

    public function destroyImage(Product $product, int $image): JsonResponse
    {
        $img = $product->images()->where('id', $image)->firstOrFail();
        \Illuminate\Support\Facades\Storage::disk('public')->delete($img->path);
        $img->delete();

        return response()->json(['message' => 'Image supprimée.']);
    }

    public function reorderImages(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['integer'],
        ]);
        foreach ($data['order'] as $i => $imageId) {
            $product->images()->where('id', $imageId)->update(['order' => $i]);
        }

        return response()->json($product->images()->get());
    }

    public function export(): StreamedResponse
    {
        $headers = self::csvHeaders();

        return response()->streamDownload(function () use ($headers) {
            $out = fopen('php://output', 'w');
            fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($out, $headers, ';');
            Product::with(['category', 'brand', 'images'])->chunk(100, function ($chunk) use ($out) {
                foreach ($chunk as $p) {
                    fputcsv($out, [
                        $p->sku,
                        $p->name,
                        $p->slug,
                        $p->category?->slug,
                        $p->brand?->slug,
                        $p->short_description,
                        $p->description,
                        $p->price,
                        $p->promo_price,
                        $p->stock_quantity,
                        $p->condition,
                        $p->is_clearance ? 1 : 0,
                        $p->is_customizable ? 1 : 0,
                        $p->status,
                        $p->meta_title,
                        $p->meta_description,
                        $p->images->pluck('path')->map(fn ($path) => $path)->implode('|'),
                    ], ';');
                }
            });
            fclose($out);
        }, 'produits-'.now()->format('Y-m-d').'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function importTemplate(): StreamedResponse
    {
        $headers = self::csvHeaders();
        $examples = [
            [
                'SKU-001',
                'Réfrigérateur 2 portes 300L',
                'refrigerateur-2-portes-300l',
                'accessoires-de-cuisinieres',
                'test',
                'Économique et silencieux',
                "Description longue du produit.\nLivraison partout au Sénégal.",
                '250000',
                '220000',
                '12',
                'neuf',
                '0',
                '0',
                'published',
                'Réfrigérateur 300L — DK HOMETECH',
                'Achetez un réfrigérateur 2 portes à Dakar.',
                'https://exemple.com/photo1.jpg|https://exemple.com/photo2.jpg',
            ],
            [
                'SKU-002',
                'Canapé 3 places tissu',
                'canape-3-places-tissu',
                'accessoires-divers',
                '',
                'Confort et style',
                'Canapé moderne pour salon.',
                '180000',
                '',
                '5',
                'neuf',
                '0',
                '1',
                'draft',
                '',
                '',
                '',
            ],
        ];

        return response()->streamDownload(function () use ($headers, $examples) {
            $out = fopen('php://output', 'w');
            fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($out, $headers, ';');
            foreach ($examples as $row) {
                fputcsv($out, $row, ';');
            }
            fclose($out);
        }, 'template-import-produits.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ]);

        $path = $request->file('file')->getRealPath();
        $handle = fopen($path, 'r');
        if ($handle === false) {
            return response()->json(['message' => 'Impossible de lire le fichier.'], 422);
        }

        $firstLine = fgets($handle);
        if ($firstLine === false) {
            fclose($handle);

            return response()->json(['message' => 'Fichier CSV vide.'], 422);
        }
        $firstLine = preg_replace('/^\xEF\xBB\xBF/', '', $firstLine) ?? $firstLine;
        $delimiter = substr_count($firstLine, ';') >= substr_count($firstLine, ',') ? ';' : ',';
        $header = str_getcsv($firstLine, $delimiter);
        $header = array_map(fn ($h) => Str::of((string) $h)->trim()->lower()->toString(), $header);
        $map = array_flip($header);

        $created = 0;
        $updated = 0;
        $skipped = 0;
        $errors = [];
        $line = 1;

        while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
            $line++;
            if ($this->csvRowEmpty($row)) {
                continue;
            }

            $get = function (string $key) use ($row, $map) {
                if (! array_key_exists($key, $map)) {
                    return null;
                }
                $val = $row[$map[$key]] ?? null;

                return is_string($val) ? trim($val) : $val;
            };

            $name = trim((string) ($get('name') ?? ''));
            if ($name === '') {
                $skipped++;
                $errors[] = "Ligne {$line} : nom manquant.";
                continue;
            }

            $catSlug = trim((string) ($get('category_slug') ?? ''));
            $category = $catSlug !== ''
                ? Category::query()->where('slug', $catSlug)->first()
                : null;
            if (! $category) {
                $skipped++;
                $errors[] = "Ligne {$line} : catégorie introuvable (category_slug=\"{$catSlug}\").";
                continue;
            }

            $brandSlug = trim((string) ($get('brand_slug') ?? ''));
            $brand = $brandSlug !== ''
                ? Brand::query()->where('slug', $brandSlug)->first()
                : null;

            $slugBase = trim((string) ($get('slug') ?: Str::slug($name)));
            $slug = $slugBase !== '' ? $slugBase : Str::slug($name).'-'.Str::random(4);

            $condition = (string) ($get('condition') ?? 'neuf');
            if (! in_array($condition, ['neuf', 'reconditionne'], true)) {
                $condition = 'neuf';
            }
            $status = (string) ($get('status') ?? 'draft');
            if (! in_array($status, ['draft', 'published', 'archived'], true)) {
                $status = 'draft';
            }

            $payload = [
                'category_id' => $category->id,
                'brand_id' => $brand?->id,
                'name' => $name,
                'sku' => ($get('sku') !== null && $get('sku') !== '') ? (string) $get('sku') : null,
                'short_description' => ($get('short_description') !== null && $get('short_description') !== '')
                    ? (string) $get('short_description')
                    : null,
                'description' => (string) ($get('description') ?? ''),
                'price' => $this->csvInt($get('price')),
                'promo_price' => $this->csvInt($get('promo_price')),
                'stock_quantity' => $this->csvInt($get('stock_quantity')),
                'condition' => $condition,
                'is_clearance' => $this->csvBool($get('is_clearance')),
                'is_customizable' => $this->csvBool($get('is_customizable')),
                'status' => $status,
                'meta_title' => ($get('meta_title') !== null && $get('meta_title') !== '')
                    ? (string) $get('meta_title')
                    : null,
                'meta_description' => ($get('meta_description') !== null && $get('meta_description') !== '')
                    ? (string) $get('meta_description')
                    : null,
            ];

            $existing = Product::query()->where('slug', $slug)->first();
            if ($existing) {
                $existing->update($payload);
                $product = $existing;
                $updated++;
            } else {
                $product = Product::query()->create(array_merge($payload, ['slug' => $slug]));
                $created++;
            }

            $imageUrls = trim((string) ($get('image_urls') ?? ''));
            if ($imageUrls !== '') {
                $this->importImagesFromUrls($product, $imageUrls);
            }
        }

        fclose($handle);
        app(\App\Services\CategoryService::class)->forgetTreeCache();

        return response()->json([
            'created' => $created,
            'updated' => $updated,
            'skipped' => $skipped,
            'errors' => array_slice($errors, 0, 50),
            'message' => "Import terminé : {$created} créé(s), {$updated} mis à jour, {$skipped} ignoré(s).",
        ]);
    }

    /** @return list<string> */
    private static function csvHeaders(): array
    {
        return [
            'sku',
            'name',
            'slug',
            'category_slug',
            'brand_slug',
            'short_description',
            'description',
            'price',
            'promo_price',
            'stock_quantity',
            'condition',
            'is_clearance',
            'is_customizable',
            'status',
            'meta_title',
            'meta_description',
            'image_urls',
        ];
    }

    private function csvRowEmpty(array $row): bool
    {
        foreach ($row as $cell) {
            if (trim((string) $cell) !== '') {
                return false;
            }
        }

        return true;
    }

    private function csvInt(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }
        $clean = preg_replace('/[^\d\-]/', '', (string) $value);

        return $clean === '' || $clean === null ? null : (int) $clean;
    }

    private function csvBool(mixed $value): bool
    {
        $v = Str::lower(trim((string) ($value ?? '')));

        return in_array($v, ['1', 'true', 'oui', 'yes', 'y'], true);
    }

    private function importImagesFromUrls(Product $product, string $imageUrls): void
    {
        $urls = preg_split('/[|,]/', $imageUrls) ?: [];
        $order = (int) $product->images()->max('order');
        foreach ($urls as $url) {
            $url = trim($url);
            if ($url === '' || ! filter_var($url, FILTER_VALIDATE_URL)) {
                continue;
            }
            try {
                $contents = @file_get_contents($url);
                if ($contents === false || $contents === '') {
                    continue;
                }
                $ext = pathinfo(parse_url($url, PHP_URL_PATH) ?? '', PATHINFO_EXTENSION) ?: 'jpg';
                $ext = Str::lower($ext);
                if (! in_array($ext, ['jpg', 'jpeg', 'png', 'webp'], true)) {
                    $ext = 'jpg';
                }
                $filename = 'products/'.Str::uuid().'.'.$ext;
                \Illuminate\Support\Facades\Storage::disk('public')->put($filename, $contents);
                $order++;
                $product->images()->create([
                    'path' => $filename,
                    'role' => $order === 1 ? 'cover' : 'other',
                    'label' => null,
                    'order' => $order,
                ]);
            } catch (\Throwable) {
                continue;
            }
        }
    }

    private function syncAttributes(Product $product, array $attrs): void
    {
        ProductAttributeValue::query()->where('product_id', $product->id)->delete();
        foreach ($attrs as $attr) {
            if (empty($attr['category_attribute_id']) || ! isset($attr['value'])) {
                continue;
            }
            ProductAttributeValue::query()->create([
                'product_id' => $product->id,
                'category_attribute_id' => $attr['category_attribute_id'],
                'value' => (string) $attr['value'],
            ]);
        }
    }

    private function syncShowrooms(Product $product, array $stocks): void
    {
        $sync = [];
        foreach ($stocks as $row) {
            if (empty($row['showroom_id'])) {
                continue;
            }
            $sync[(int) $row['showroom_id']] = [
                'stock_quantity' => $row['stock_quantity'] ?? null,
                'is_available' => (bool) ($row['is_available'] ?? true),
            ];
        }
        $product->showrooms()->sync($sync);
    }
}
