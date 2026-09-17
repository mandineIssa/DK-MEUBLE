<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Services\CategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index(Request $request, CategoryService $categories): JsonResponse
    {
        $query = Product::query()
            ->published()
            ->with(['category', 'images', 'brand', 'promotions']);

        if ($request->query('category')) {
            $cat = Category::query()->where('slug', $request->query('category'))->first();
            if ($cat) {
                $query->whereIn('category_id', $categories->descendantIds($cat));
            }
        }

        if ($request->query('brand')) {
            $query->whereHas('brand', fn ($q) => $q->where('slug', $request->query('brand')));
        }

        if ($request->boolean('clearance') || $request->query('clearance') === '1') {
            $query->where('is_clearance', true);
        }

        if ($request->query('condition')) {
            $query->where('condition', $request->query('condition'));
        }

        if ($request->boolean('promo') || $request->query('promo') === '1') {
            $query->where(function ($q) {
                $q->whereHas('promotions', fn ($p) => $p->publicVisible())
                    ->orWhere(function ($w) {
                        $w->whereNotNull('promo_price')
                            ->whereColumn('promo_price', '<', 'price');
                    });
            });
        }

        if ($request->query('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        if ($request->query('min_price') !== null && $request->query('min_price') !== '') {
            $query->where('price', '>=', (int) $request->query('min_price'));
        }
        if ($request->query('max_price') !== null && $request->query('max_price') !== '') {
            $query->where('price', '<=', (int) $request->query('max_price'));
        }

        match ($request->query('sort')) {
            'price_asc' => $query->orderBy('price'),
            'price_desc' => $query->orderByDesc('price'),
            'promo' => $query->orderByRaw('CASE WHEN promo_price IS NOT NULL THEN 0 ELSE 1 END')->latest(),
            default => $query->latest(),
        };

        // Évite de charger tout le catalogue : pagination (sitemap peut demander per_page élevé).
        $perPage = (int) $request->query('per_page', 24);
        if ($perPage <= 0) {
            $perPage = 24;
        }
        $perPage = min(100, $perPage);

        $paginator = $query->paginate($perPage);

        // Compatibilité front existant (attend un tableau) + meta pour pagination.
        if ($request->boolean('paginated') || $request->query('page')) {
            return response()->json([
                'data' => $paginator->items(),
                'meta' => [
                    'total' => $paginator->total(),
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                ],
            ]);
        }

        return response()->json($paginator->items());
    }

    public function searchByImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $path = $request->file('image')->store('search-uploads', 'public');
        $absolute = Storage::disk('public')->path($path);

        $keywords = $this->visionKeywords($absolute);
        if ($keywords === []) {
            $base = pathinfo($request->file('image')->getClientOriginalName(), PATHINFO_FILENAME);
            $keywords = preg_split('/[\s_\-]+/', strtolower($base)) ?: [];
            $keywords = array_values(array_filter($keywords, fn ($w) => strlen($w) >= 3));
        }

        $query = Product::query()->published()->with(['category', 'images', 'brand', 'promotions']);

        if ($keywords !== []) {
            $query->where(function ($q) use ($keywords) {
                foreach ($keywords as $word) {
                    $q->orWhere('name', 'like', "%{$word}%")
                        ->orWhere('description', 'like', "%{$word}%");
                }
            });
        }

        $products = $query->latest()->limit(24)->get();

        if ($products->isEmpty()) {
            $products = Product::query()
                ->published()
                ->with(['category', 'images', 'brand', 'promotions'])
                ->latest()
                ->limit(12)
                ->get();
        }

        return response()->json([
            'products' => $products,
            'keywords' => $keywords,
            'image_url' => $path,
            'fallback' => $keywords === [],
        ]);
    }

    private function visionKeywords(string $absolutePath): array
    {
        $apiKey = config('services.google.vision_api_key') ?: env('GOOGLE_VISION_API_KEY');
        if (! $apiKey || ! is_readable($absolutePath)) {
            return [];
        }

        try {
            $image = base64_encode((string) file_get_contents($absolutePath));
            $payload = [
                'requests' => [[
                    'image' => ['content' => $image],
                    'features' => [['type' => 'LABEL_DETECTION', 'maxResults' => 8]],
                ]],
            ];

            $ch = curl_init('https://vision.googleapis.com/v1/images:annotate?key='.urlencode($apiKey));
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
                CURLOPT_POSTFIELDS => json_encode($payload),
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 12,
            ]);
            $raw = curl_exec($ch);
            curl_close($ch);
            if (! $raw) {
                return [];
            }

            $json = json_decode($raw, true);
            $labels = $json['responses'][0]['labelAnnotations'] ?? [];
            $words = [];
            foreach ($labels as $label) {
                $desc = strtolower((string) ($label['description'] ?? ''));
                foreach (preg_split('/\s+/', $desc) ?: [] as $w) {
                    if (strlen($w) >= 3) {
                        $words[] = $w;
                    }
                }
            }

            return array_values(array_unique($words));
        } catch (\Throwable $e) {
            return [];
        }
    }

    public function show(string $slug): JsonResponse
    {
        $product = Product::query()
            ->published()
            ->with([
                'category',
                'images',
                'brand',
                'promotions',
                'attributeValues.attribute',
                'showrooms' => fn ($q) => $q->where('showrooms.is_active', true),
            ])
            ->where('slug', $slug)
            ->firstOrFail();

        return response()->json($product);
    }
}
