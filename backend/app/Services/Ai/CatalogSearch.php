<?php

namespace App\Services\Ai;

use App\Models\Category;
use App\Models\PageView;
use App\Models\Product;
use App\Models\SearchQuery;
use App\Services\CategoryService;
use Illuminate\Support\Collection;

class CatalogSearch
{
    public function __construct(
        private QueryInterpreter $interpreter,
        private CategoryService $categories,
    ) {}

    /**
     * @return array{parsed: array<string, mixed>, products: Collection<int, Product>, groups: list<array{title: string, products: list<Product>}>, message: string}
     */
    public function search(string $text, string $source = 'text'): array
    {
        $text = trim($text);
        $parsed = $this->interpreter->parse($text, $this->categoryRows());
        $hasSignal = ($parsed['keywords'] !== []) || $parsed['category_id'] || $parsed['max_price'] || $parsed['min_price'];
        $products = ! $hasSignal
            ? collect()
            : ($parsed['multi'] ? $this->bundle($parsed) : $this->query($parsed));

        try {
            SearchQuery::query()->create([
                'query' => mb_substr($text, 0, 180),
                'source' => $source,
                'results_count' => $products->count(),
                'parsed' => $parsed,
            ]);
        } catch (\Throwable) {
        }

        return [
            'parsed' => $parsed,
            'products' => $products->values(),
            'groups' => $parsed['multi'] ? $this->groups($products) : [],
            'message' => $products->isEmpty()
                ? 'Aucun produit du catalogue ne correspond à cette demande.'
                : ($parsed['multi']
                    ? 'Voici une sélection de produits réellement disponibles dans le catalogue, dans la limite du budget indiqué.'
                    : 'Voici les produits du catalogue qui correspondent.'),
        ];
    }

    /** @return array<string, Collection<int, Product>> */
    public function recommend(Product $product): array
    {
        $price = $product->effective_price;
        $similar = $this->base()
            ->when($product->category_id, fn ($q) => $q->where('category_id', $product->category_id))
            ->where('id', '!=', $product->id)
            ->limit(24)
            ->get()
            ->sortBy(fn (Product $row) => $price && $row->effective_price ? abs($row->effective_price - $price) : PHP_INT_MAX)
            ->take(4)
            ->values();

        $budget = $similar;
        if ($price) {
            $budget = $similar->filter(fn (Product $row) => $row->effective_price && $row->effective_price <= $price)->values();
            if ($budget->isEmpty()) {
                $budget = $this->base()
                    ->where('id', '!=', $product->id)
                    ->whereNotNull('price')
                    ->where('price', '<=', $price)
                    ->limit(4)
                    ->get();
            }
        }

        return [
            'similar' => $similar,
            'also' => $similar,
            'budget' => $budget,
            'complement' => $this->complements($product),
        ];
    }

    /**
     * Produits publiés des mêmes catégories que les fiches consultées.
     *
     * @param list<string> $slugs
     * @return array{products: Collection<int, Product>, message: string}
     */
    public function forVisitor(array $slugs, ?string $visitorId): array
    {
        $slugs = $this->viewedSlugs($slugs, $visitorId);
        if ($slugs === []) {
            return ['products' => collect(), 'message' => ''];
        }

        $seen = $this->base()->whereIn('slug', $slugs)->get();
        if ($seen->isEmpty()) {
            return ['products' => collect(), 'message' => ''];
        }

        $categoryIds = $seen->pluck('category_id')->filter()->unique()->values()->all();
        $products = $this->base()
            ->when($categoryIds !== [], fn ($q) => $q->whereIn('category_id', $categoryIds))
            ->whereNotIn('id', $seen->pluck('id')->all())
            ->latest('id')
            ->limit(8)
            ->get();

        return [
            'products' => $products->values(),
            'message' => $products->isEmpty()
                ? ''
                : 'Suggestions à partir des fiches consultées. Chaque produit vient du catalogue publié.',
        ];
    }

    /** @param list<int> $productIds */
    public function complementsForCart(array $productIds): Collection
    {
        $found = collect();
        $products = Product::query()->published()->whereIn('id', $productIds)->get();
        foreach ($products as $product) {
            $found = $found->merge($this->complements($product));
        }

        return $found->unique('id')->reject(fn (Product $row) => in_array($row->id, $productIds, true))->take(4)->values();
    }

    /**
     * @param array<string, mixed> $input
     * @return array{items: list<array{product: Product, quantity: int, note: string|null}>, total: int, budget: int|null, message: string}
     */
    public function plan(array $input): array
    {
        $mode = (string) ($input['mode'] ?? 'maison');
        $budget = isset($input['budget']) && $input['budget'] !== '' ? (int) $input['budget'] : null;
        $style = trim((string) ($input['style'] ?? ''));
        $terms = $this->planTerms($mode, $input);
        $items = [];
        $spent = 0;

        foreach ($terms as $term) {
            $wantedQty = max(1, (int) ($term['quantity'] ?? 1));
            $parsed = $this->interpreter->parse(trim($term['query'].' '.$style), $this->categoryRows());
            if ($budget !== null) {
                $parsed['max_price'] = max(0, $budget - $spent);
            }
            $wanted = $this->fold($term['query']);
            $product = $this->query($parsed)->sortBy(function (Product $row) use ($wanted) {
                $name = $this->fold($row->name);
                $rank = str_starts_with($name, $wanted) ? 0 : 1;

                return [$rank, $row->effective_price ?? PHP_INT_MAX];
            })->first();
            if (! $product || $product->effective_price === null) {
                continue;
            }
            $available = $product->stock_quantity;
            $quantity = $available === null ? $wantedQty : min($wantedQty, (int) $available);
            if ($quantity < 1) {
                continue;
            }
            $line = $product->effective_price * $quantity;
            if ($budget !== null && $spent + $line > $budget) {
                $quantity = intdiv($budget - $spent, $product->effective_price);
                if ($quantity < 1) {
                    continue;
                }
                $line = $product->effective_price * $quantity;
            }
            $note = null;
            if ($quantity < $wantedQty) {
                $note = $available === 0
                    ? 'Rupture : quantité non proposée.'
                    : "Le catalogue ne couvre pas {$wantedQty} unité(s). Quantité proposée : {$quantity}.";
            }
            $items[] = ['product' => $product, 'quantity' => $quantity, 'note' => $note];
            $spent += $line;
        }

        return [
            'items' => $items,
            'total' => $spent,
            'budget' => $budget,
            'message' => $items === []
                ? 'Aucun produit du catalogue ne permet de construire cette sélection avec les critères indiqués.'
                : 'Sélection construite uniquement avec des produits publiés et leurs prix enregistrés.',
        ];
    }

    /**
     * @param list<string> $slugs
     * @return array{products: Collection<int, Product>, rows: list<array{label: string, values: list<string>}>, analysis: string, missing: list<string>}
     */
    public function compare(array $slugs): array
    {
        $products = collect($slugs)
            ->map(fn ($slug) => Product::query()->published()->with(['category', 'images', 'brand', 'promotions'])->where('slug', $slug)->first())
            ->filter()
            ->values();

        $rows = [
            $this->row('Prix', $products, fn (Product $p) => $p->effective_price !== null ? number_format($p->effective_price, 0, ',', ' ').' FCFA' : 'Sur devis'),
            $this->row('Référence', $products, fn (Product $p) => $p->sku ?: '—'),
            $this->row('Marque', $products, fn (Product $p) => $p->brand?->name ?: '—'),
            $this->row('Catégorie', $products, fn (Product $p) => $p->category?->name ?: '—'),
            $this->row('Stock', $products, fn (Product $p) => $this->stockLabel($p)),
            $this->row('État', $products, fn (Product $p) => $p->condition === 'reconditionne' ? 'Reconditionné' : 'Neuf'),
        ];

        $specKeys = [];
        foreach ($products as $product) {
            foreach (array_keys(is_array($product->specs) ? $product->specs : []) as $key) {
                $specKeys[$key] = true;
            }
        }
        $missing = [];
        foreach (array_keys($specKeys) as $key) {
            $values = [];
            $blank = 0;
            foreach ($products as $product) {
                $value = is_array($product->specs) ? ($product->specs[$key] ?? null) : null;
                $text = trim((string) $value);
                if ($text === '') {
                    $blank++;
                    $text = 'Non renseigné';
                }
                $values[] = $text;
            }
            $rows[] = ['label' => (string) $key, 'values' => $values];
            if ($blank > 0) {
                $missing[] = (string) $key;
            }
        }

        $parts = [];
        foreach ($products as $product) {
            $price = $product->effective_price !== null ? number_format($product->effective_price, 0, ',', ' ').' FCFA' : 'un prix sur devis';
            $parts[] = $product->name.' est affiché à '.$price.', stock : '.$this->stockLabel($product).'.';
        }
        if ($missing !== []) {
            $parts[] = 'Ces caractéristiques ne sont pas renseignées pour tous les produits : '.implode(', ', $missing).'. Elles ne sont donc pas comparées.';
        }
        $parts[] = 'Aucun critère absent du catalogue n’est ajouté. Cette lecture ne désigne pas un meilleur produit.';

        return [
            'products' => $products,
            'rows' => $rows,
            'analysis' => implode(' ', $parts),
            'missing' => $missing,
        ];
    }

    /** @param array<string, mixed> $parsed */
    private function query(array $parsed): Collection
    {
        $strict = $this->apply($parsed, true);
        if ($strict->isNotEmpty()) {
            return $strict;
        }
        if (($parsed['keywords'] ?? []) === [] && empty($parsed['category_id'])) {
            return $strict;
        }
        $loose = $this->apply($parsed, false);
        if ($loose->isNotEmpty() || empty($parsed['keywords']) || empty($parsed['category_id'])) {
            return $loose;
        }
        $parsed['category_id'] = null;
        $parsed['category'] = null;

        return $this->apply($parsed, false);
    }

    /**
     * Produits dont le nom, la marque ou la catégorie contient l'un des mots.
     *
     * @param list<string> $words
     */
    public function productsForWords(array $words): Collection
    {
        $words = array_values(array_filter(array_map(fn ($word) => trim((string) $word), $words)));
        if ($words === []) {
            return collect();
        }

        return $this->apply([
            'keywords' => array_slice($words, 0, 4),
            'category_id' => null,
            'category' => null,
            'max_price' => null,
            'min_price' => null,
            'multi' => false,
        ], false)->take(24)->values();
    }

    /** @param array<string, mixed> $parsed */
    private function apply(array $parsed, bool $allKeywords): Collection
    {
        $query = $this->base();
        if ($parsed['category_id']) {
            $category = Category::query()->find($parsed['category_id']);
            if ($category) {
                $query->whereIn('category_id', $this->categories->descendantIds($category));
            }
        }
        $keywords = $parsed['keywords'] ?? [];
        if ($parsed['max_price']) {
            $max = (int) $parsed['max_price'];
            $query->where(function ($q) use ($max) {
                $q->where('price', '<=', $max)->orWhere('promo_price', '<=', $max);
            });
        }

        return $query->limit($keywords === [] ? 24 : 300)->get()->filter(function (Product $product) use ($parsed, $keywords, $allKeywords) {
            $price = $product->effective_price;
            if ($parsed['max_price'] && $price !== null && $price > (int) $parsed['max_price']) {
                return false;
            }
            if ($parsed['min_price'] && $price !== null && $price < (int) $parsed['min_price']) {
                return false;
            }
            if ($keywords === []) {
                return true;
            }
            $hay = $this->fold(implode(' ', array_filter([
                $product->name,
                $product->brand?->name,
                $product->category?->name,
                $product->short_description,
                $product->description,
                $product->sku,
            ])));
            $matched = 0;
            foreach ($keywords as $word) {
                if (WordMatch::contains($hay, (string) $word)) {
                    $matched++;
                }
            }
            if ($allKeywords) {
                return $matched === count($keywords);
            }

            return $matched > 0;
        })->sortBy(function (Product $product) use ($keywords) {
            $name = $this->fold((string) $product->name);
            $brand = $this->fold((string) ($product->brand?->name ?? ''));
            $category = $this->fold((string) ($product->category?->name ?? ''));
            $rank = 2;
            foreach ($keywords as $word) {
                if (WordMatch::contains($name, (string) $word)) {
                    return 0;
                }
                if (WordMatch::contains($brand, (string) $word) || WordMatch::contains($category, (string) $word)) {
                    $rank = 1;
                }
            }

            return $rank;
        })->values();
    }

    /** @param array<string, mixed> $parsed */
    private function bundle(array $parsed): Collection
    {
        $picked = collect();
        $terms = $parsed['keywords'] ?: [];
        if ($terms === [] && $parsed['category']) {
            $terms = [$parsed['category']];
        }
        $remaining = $parsed['max_price'];
        foreach ($terms as $term) {
            $one = $parsed;
            $one['keywords'] = [$term];
            $one['multi'] = false;
            $one['max_price'] = $remaining;
            $product = $this->query($one)->sortBy(fn (Product $row) => $row->effective_price ?? PHP_INT_MAX)->first();
            if (! $product || $picked->contains('id', $product->id)) {
                continue;
            }
            $picked->push($product);
            if ($remaining !== null && $product->effective_price) {
                $remaining -= $product->effective_price;
            }
        }

        return $picked->values();
    }

    private function complements(Product $product): Collection
    {
        $blob = $this->fold(($product->category?->name ?? '').' '.$product->name);
        $hints = [
            'television' => ['support', 'meuble'],
            'televiseur' => ['support'],
            'tv' => ['support'],
            'refrigerateur' => ['support'],
            'canape' => ['table'],
            'lit' => ['matelas', 'armoire'],
            'bureau' => ['fauteuil', 'chaise'],
            'climatiseur' => ['support'],
        ];
        $words = [];
        foreach ($hints as $needle => $list) {
            if (str_contains($blob, $needle)) {
                $words = array_merge($words, $list);
            }
        }
        if ($words === []) {
            return collect();
        }

        return $this->base()
            ->where('id', '!=', $product->id)
            ->where(function ($q) use ($words) {
                foreach ($words as $word) {
                    $q->orWhere('name', 'like', '%'.$word.'%');
                }
            })
            ->limit(4)
            ->get();
    }

    /** @param array<string, mixed> $input
     *  @return list<array{query: string, quantity: int}>
     */
    private function planTerms(string $mode, array $input): array
    {
        $wants = array_values(array_filter(array_map('trim', (array) ($input['wants'] ?? []))));
        if ($mode === 'bureau') {
            $desks = max(1, (int) ($input['desks'] ?? $input['employees'] ?? 1));
            $base = $wants !== [] ? $wants : ['bureau', 'fauteuil', 'armoire'];
            return array_map(function (string $term) use ($desks) {
                $qty = preg_match('/bureau|fauteuil|chaise/i', $term) ? $desks : 1;

                return ['query' => $term, 'quantity' => $qty];
            }, $base);
        }

        $sector = $this->fold((string) ($input['sector'] ?? ''));
        $defaults = match (true) {
            str_contains($sector, 'hotel') => ['lit', 'armoire', 'television', 'refrigerateur'],
            str_contains($sector, 'restaurant') => ['table', 'chaise', 'refrigerateur'],
            str_contains($sector, 'ecole') => ['bureau', 'chaise', 'armoire'],
            str_contains($sector, 'commerce') => ['presentoir', 'etagere', 'refrigerateur'],
            str_contains($sector, 'administration') => ['bureau', 'fauteuil', 'armoire'],
            $mode === 'secteur' => ['bureau', 'chaise'],
            default => ['canape', 'lit', 'armoire', 'refrigerateur', 'televiseur', 'table', 'chaise'],
        };
        $terms = $wants !== [] ? $wants : $defaults;

        return array_map(fn (string $term) => ['query' => $term, 'quantity' => 1], $terms);
    }

    public function interpret(string $text): array
    {
        return $this->interpreter->parse($text, $this->categoryRows());
    }

    private function fold(string $value): string
    {
        $value = mb_strtolower($value);

        return strtr($value, [
            'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
            'à' => 'a', 'â' => 'a', 'ä' => 'a',
            'ù' => 'u', 'û' => 'u', 'ü' => 'u',
            'ô' => 'o', 'ö' => 'o', 'î' => 'i', 'ï' => 'i', 'ç' => 'c',
        ]);
    }

    /** @return list<array{id: int, name: string, slug: string}> */
    private function categoryRows(): array
    {
        return Category::query()->get(['id', 'name', 'slug'])->map(fn (Category $row) => [
            'id' => $row->id,
            'name' => $row->name,
            'slug' => $row->slug,
        ])->all();
    }

    /**
     * @param list<string> $slugs
     * @return list<string>
     */
    private function viewedSlugs(array $slugs, ?string $visitorId): array
    {
        $clean = [];
        foreach ($slugs as $slug) {
            $slug = trim((string) $slug);
            if (preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/i', $slug)) {
                $clean[] = $slug;
            }
        }

        $visitorId = trim((string) $visitorId);
        if ($visitorId !== '' && strlen($visitorId) <= 80) {
            $paths = PageView::query()
                ->where('visitor_id', $visitorId)
                ->where('path', 'like', '/produits/%')
                ->orderByDesc('id')
                ->limit(30)
                ->pluck('path');
            foreach ($paths as $path) {
                $slug = rawurldecode(basename((string) parse_url((string) $path, PHP_URL_PATH)));
                if (preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/i', $slug)) {
                    $clean[] = $slug;
                }
            }
        }

        return array_slice(array_values(array_unique($clean)), 0, 20);
    }

    private function base()
    {
        return Product::query()->published()->with(['category', 'images', 'brand', 'promotions']);
    }

    /** @param Collection<int, Product> $products
     *  @return list<array{title: string, products: list<Product>}>
     */
    private function groups(Collection $products): array
    {
        return $products->groupBy(fn (Product $product) => $product->category?->name ?: 'Autres')
            ->map(fn (Collection $rows, string $title) => ['title' => $title, 'products' => $rows->values()->all()])
            ->values()
            ->all();
    }

    /** @param Collection<int, Product> $products */
    private function row(string $label, Collection $products, callable $value): array
    {
        return [
            'label' => $label,
            'values' => $products->map(fn (Product $product) => (string) $value($product))->all(),
        ];
    }

    private function stockLabel(Product $product): string
    {
        if ($product->stock_quantity === null) {
            return 'Quantité non suivie';
        }
        if ($product->stock_quantity === 0) {
            return $product->is_customizable ? 'Sur commande' : 'Rupture';
        }
        if ($product->stock_quantity <= 3) {
            return 'Stock limité ('.$product->stock_quantity.')';
        }

        return 'Disponible ('.$product->stock_quantity.')';
    }
}
