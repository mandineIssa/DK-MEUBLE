<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Services\Ai\AiClient;
use App\Services\Ai\CatalogSearch;
use App\Services\Ai\VisualTerms;
use App\Services\Ai\WordMatch;
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

        if ($request->query('min_price') !== null && $request->query('min_price') !== '') {
            $query->where('price', '>=', (int) $request->query('min_price'));
        }
        if ($request->query('max_price') !== null && $request->query('max_price') !== '') {
            $query->where('price', '<=', (int) $request->query('max_price'));
        }

        $search = trim((string) $request->query('search', ''));
        $searchGroups = $search !== '' ? $this->searchGroups($search) : [];
        if ($searchGroups !== []) {
            return $this->respondSearch($query->latest()->get(), $searchGroups, $request);
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

    public function searchByImage(Request $request, CatalogSearch $catalog, VisualTerms $terms, AiClient $ai): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $file = $request->file('image');
        $path = $file->store('search-uploads', 'public');
        $absolute = Storage::disk('public')->path($path);

        $labels = array_merge(
            $this->aiImageWords($ai, $absolute),
            $this->visionKeywords($absolute),
            $terms->filenameWords($file->getClientOriginalName())
        );
        $keywords = $terms->toCatalogWords($labels);
        $products = $catalog->productsForWords($keywords);
        $products->each(function (Product $product) use ($keywords) {
            $name = WordMatch::fold($product->name.' '.($product->category?->name ?? '').' '.($product->brand?->name ?? ''));
            $hits = 0;
            foreach ($keywords as $word) {
                if (WordMatch::contains($name, $word)) {
                    $hits++;
                }
            }
            $product->setAttribute('similarity', $keywords === [] ? 0 : (int) round(($hits / max(1, count($keywords))) * 100));
        });

        return response()->json([
            'products' => $products->values(),
            'keywords' => $keywords,
            'image_url' => $path,
            'fallback' => $products->isEmpty(),
            'message' => $products->isEmpty()
                ? ($keywords === []
                    ? 'La photo n\'a pas pu être rapprochée du catalogue. Aucun modèle identique n\'est affirmé.'
                    : 'Nous n\'avons pas trouvé ce type de produit dans le catalogue.')
                : 'Produits du catalogue proches des mots reconnus : '.implode(', ', $keywords).'. Ce n\'est pas le modèle exact de la photo.',
            'similarity_note' => 'Estimation d\'après les mots reconnus, pas une identification du modèle.',
        ]);
    }

    /** @return list<string> */
    private function aiImageWords(AiClient $ai, string $absolutePath): array
    {
        if (! $ai->configured() || ! is_readable($absolutePath)) {
            return [];
        }

        $text = $ai->look($absolutePath);
        if ($text === null || $text === '') {
            return [];
        }

        return preg_split('/[,;\n]+/u', $text) ?: [];
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

    /**
     * Chaque mot saisi doit apparaître en entier dans le nom, la marque, la catégorie ou le texte.
     * Les accents et un pluriel simple sont ignorés. « confortable » ne vaut pas « table ».
     *
     * @param \Illuminate\Support\Collection<int, Product> $products
     * @param list<list<string>> $groups
     */
    private function respondSearch($products, array $groups, Request $request): JsonResponse
    {
        $matched = $products->filter(function (Product $product) use ($groups) {
            $hay = implode(' ', array_filter([
                $product->name,
                $product->short_description,
                $product->description,
                $product->sku,
                $product->brand?->name,
                $product->category?->name,
            ]));
            foreach ($groups as $forms) {
                $hit = false;
                foreach ($forms as $form) {
                    if (WordMatch::contains($hay, $form)) {
                        $hit = true;
                        break;
                    }
                }
                if (! $hit) {
                    return false;
                }
            }

            return true;
        })->values();

        $matched = match ($request->query('sort')) {
            'price_asc' => $matched->sortBy('price')->values(),
            'price_desc' => $matched->sortByDesc('price')->values(),
            default => $matched->sortBy(fn (Product $product) => WordMatch::contains((string) $product->name, $groups[0][0]) ? 0 : 1)->values(),
        };

        $perPage = min(100, max(1, (int) $request->query('per_page', 24)));
        $page = max(1, (int) $request->query('page', 1));
        $total = $matched->count();
        $items = $matched->slice(($page - 1) * $perPage, $perPage)->values();

        if ($request->boolean('paginated') || $request->query('page')) {
            return response()->json([
                'data' => $items,
                'meta' => [
                    'total' => $total,
                    'current_page' => $page,
                    'last_page' => max(1, (int) ceil($total / $perPage)),
                    'per_page' => $perPage,
                ],
            ]);
        }

        return response()->json($items);
    }

    /** @return list<list<string>> */
    private function searchGroups(string $search): array
    {
        $search = str_replace(['%', '_'], '', WordMatch::fold($search));
        $groups = [];
        foreach (preg_split('/[^\p{L}\p{N}]+/u', $search) ?: [] as $part) {
            $forms = WordMatch::forms((string) $part);
            if ($forms !== []) {
                $groups[] = $forms;
            }
        }

        return array_slice($groups, 0, 6);
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
