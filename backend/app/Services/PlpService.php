<?php

namespace App\Services;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class PlpService
{
    /** @var array<string, mixed>|null */
    protected ?array $settingsMemo = null;

    /** @var array<string, Category>|null */
    protected ?array $categoriesBySlug = null;

    /** @var array<int, array<int, int>>|null parent_id => child ids */
    protected ?array $childrenByParent = null;

    public static function defaultSettings(): array
    {
        return [
            'filters' => [
                'category' => true,
                'price' => true,
                'brand' => true,
                'condition' => true,
                'attributes' => true,
                'availability' => true,
            ],
            'sort_options' => [
                ['value' => 'default', 'label' => 'Tri par défaut', 'enabled' => true],
                ['value' => 'popular', 'label' => 'Popularité', 'enabled' => true],
                ['value' => 'newest', 'label' => 'Nouveauté', 'enabled' => true],
                ['value' => 'price_asc', 'label' => 'Prix croissant', 'enabled' => true],
                ['value' => 'price_desc', 'label' => 'Prix décroissant', 'enabled' => true],
                ['value' => 'promo', 'label' => 'Meilleures réductions', 'enabled' => true],
            ],
            'default_sort' => 'default',
            'default_view' => 'grid_4',
            'view_modes' => [
                'grid_2' => true,
                'grid_3' => true,
                'grid_4' => true,
                'list' => true,
            ],
            'accordion_mode' => 'multiple', // exclusive | multiple
            'show_subcategories' => true,
            'category_order' => 'manual', // manual (display_order) | alpha | custom
            'category_filter_title' => 'Catégories de produits',
            // Liste ordonnée : [{ id, enabled, label?, children: [{ id, enabled, label? }] }]
            // Vide = toutes les catégories actives (auto).
            'category_filter_items' => [],
            'accent_color' => '#FF7A00',
            'popularity_logic' => 'quotes', // quotes | manual
            'per_page' => 24,
            'realtime_filter' => true,
            'infinite_scroll' => false,
            'show_breadcrumb' => true,
        ];
    }

    public function settings(): array
    {
        if ($this->settingsMemo !== null) {
            return $this->settingsMemo;
        }

        $stored = Setting::query()->where('key', 'plp')->value('value');
        $value = is_array($stored) ? $stored : [];

        return $this->settingsMemo = array_replace_recursive(self::defaultSettings(), $value);
    }

    public function updateSettings(array $payload): array
    {
        $current = $this->settings();

        // Remplacement intégral pour les listes (évite le merge indexé cassé).
        foreach (['sort_options', 'category_filter_items', 'view_modes', 'filters'] as $listKey) {
            if (array_key_exists($listKey, $payload)) {
                $current[$listKey] = $payload[$listKey];
                unset($payload[$listKey]);
            }
        }

        $merged = array_replace_recursive($current, $payload);
        Setting::query()->updateOrCreate(['key' => 'plp'], ['value' => $merged]);
        $this->settingsMemo = null;
        Cache::forget('plp:settings:v1');

        return $this->settingsForAdmin();
    }

    /**
     * Settings enrichis pour l’admin (arbre éditable synchronisé avec la BDD).
     */
    public function settingsForAdmin(): array
    {
        $settings = $this->settings();
        $settings['category_filter_items'] = $this->syncCategoryFilterItems(
            is_array($settings['category_filter_items'] ?? null) ? $settings['category_filter_items'] : []
        );

        return $settings;
    }

    /**
     * Synchronise la config filtre avec les catégories actuelles (ajoute les nouvelles, retire les supprimées).
     *
     * @param  array<int, array<string, mixed>>  $stored
     * @return array<int, array<string, mixed>>
     */
    public function syncCategoryFilterItems(array $stored): array
    {
        $roots = Category::query()
            ->whereNull('parent_id')
            ->where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('name')
            ->with(['children' => fn ($q) => $q->where('is_active', true)->orderBy('display_order')->orderBy('name')])
            ->get();

        $byId = [];
        foreach ($stored as $item) {
            if (! is_array($item) || ! isset($item['id'])) {
                continue;
            }
            $byId[(int) $item['id']] = $item;
        }

        $result = [];
        // D’abord l’ordre stocké (si encore valide)
        foreach ($stored as $item) {
            if (! is_array($item) || ! isset($item['id'])) {
                continue;
            }
            $root = $roots->firstWhere('id', (int) $item['id']);
            if (! $root) {
                continue;
            }
            $result[] = $this->mapFilterRoot($root, $item);
        }
        // Puis les nouvelles racines absentes de la config
        foreach ($roots as $root) {
            if (isset($byId[$root->id])) {
                continue;
            }
            $result[] = $this->mapFilterRoot($root, null);
        }

        return $result;
    }

    /**
     * @param  array<string, mixed>|null  $stored
     * @return array<string, mixed>
     */
    protected function mapFilterRoot(Category $root, ?array $stored): array
    {
        $childStored = [];
        if (is_array($stored['children'] ?? null)) {
            foreach ($stored['children'] as $ch) {
                if (is_array($ch) && isset($ch['id'])) {
                    $childStored[(int) $ch['id']] = $ch;
                }
            }
        }

        $children = [];
        // Ordre stocké
        if (is_array($stored['children'] ?? null)) {
            foreach ($stored['children'] as $ch) {
                if (! is_array($ch) || ! isset($ch['id'])) {
                    continue;
                }
                $child = ($root->children ?? collect())->firstWhere('id', (int) $ch['id']);
                if (! $child) {
                    continue;
                }
                $children[] = [
                    'id' => $child->id,
                    'name' => $child->name,
                    'slug' => $child->slug,
                    'enabled' => array_key_exists('enabled', $ch) ? (bool) $ch['enabled'] : true,
                    'label' => isset($ch['label']) && is_string($ch['label']) && $ch['label'] !== '' ? $ch['label'] : null,
                ];
            }
        }
        foreach ($root->children ?? [] as $child) {
            if (isset($childStored[$child->id])) {
                continue;
            }
            $children[] = [
                'id' => $child->id,
                'name' => $child->name,
                'slug' => $child->slug,
                'enabled' => true,
                'label' => null,
            ];
        }

        return [
            'id' => $root->id,
            'name' => $root->name,
            'slug' => $root->slug,
            'enabled' => array_key_exists('enabled', $stored ?? []) ? (bool) $stored['enabled'] : true,
            'label' => isset($stored['label']) && is_string($stored['label']) && $stored['label'] !== '' ? $stored['label'] : null,
            'children' => $children,
        ];
    }

    /**
     * Applique titre / visibilité / ordre / labels custom sur les facets catégories.
     *
     * @param  array<int, array<string, mixed>>  $categoryFacets
     * @return array<int, array<string, mixed>>
     */
    public function applyCategoryFilterConfig(array $categoryFacets): array
    {
        $settings = $this->settings();
        $items = is_array($settings['category_filter_items'] ?? null) ? $settings['category_filter_items'] : [];
        $showSubs = ($settings['show_subcategories'] ?? true) !== false;

        // Pas de config custom : ordre alpha ou display_order déjà appliqué à la requête
        if ($items === []) {
            if (! $showSubs) {
                return array_map(function (array $cat) {
                    $cat['children'] = [];

                    return $cat;
                }, $categoryFacets);
            }

            return $categoryFacets;
        }

        $synced = $this->syncCategoryFilterItems($items);
        $byId = [];
        foreach ($categoryFacets as $cat) {
            $byId[(int) $cat['id']] = $cat;
        }

        $out = [];
        foreach ($synced as $item) {
            if (! ($item['enabled'] ?? true)) {
                continue;
            }
            $facet = $byId[(int) $item['id']] ?? null;
            if (! $facet) {
                continue;
            }
            if (! empty($item['label'])) {
                $facet['name'] = $item['label'];
            }

            if (! $showSubs) {
                $facet['children'] = [];
            } else {
                $childById = [];
                foreach ($facet['children'] ?? [] as $ch) {
                    $childById[(int) $ch['id']] = $ch;
                }
                $children = [];
                foreach ($item['children'] ?? [] as $chCfg) {
                    if (! ($chCfg['enabled'] ?? true)) {
                        continue;
                    }
                    $chFacet = $childById[(int) $chCfg['id']] ?? null;
                    if (! $chFacet) {
                        continue;
                    }
                    if (! empty($chCfg['label'])) {
                        $chFacet['name'] = $chCfg['label'];
                    }
                    $children[] = $chFacet;
                }
                $facet['children'] = $children;
            }

            $out[] = $facet;
        }

        return $out;
    }

    /**
     * @param  array<string, mixed>  $params
     */
    public function listing(?Category $root, array $params, CategoryService $categories): array
    {
        $settings = $this->settings();
        $perPage = min(48, max(1, (int) ($params['per_page'] ?? $settings['per_page'] ?? 24)));
        $page = max(1, (int) ($params['page'] ?? 1));
        $sort = (string) ($params['sort'] ?? $settings['default_sort'] ?? 'newest');

        $baseIds = $root ? $categories->descendantIds($root) : null;

        $selectedCategorySlugs = $this->arrayParam($params, 'category');
        $selectedBrandSlugs = $this->arrayParam($params, 'brand');
        $condition = $params['condition'] ?? null;
        $minPrice = $params['min_price'] ?? $params['price_min'] ?? null;
        $maxPrice = $params['max_price'] ?? $params['price_max'] ?? null;
        $inStock = isset($params['in_stock']) ? filter_var($params['in_stock'], FILTER_VALIDATE_BOOLEAN) : null;
        $attrs = $this->attributeParams($params);

        $query = $this->buildQuery($baseIds, $selectedCategorySlugs, $selectedBrandSlugs, $condition, $minPrice, $maxPrice, $inStock, $attrs, $categories);
        $this->applySort($query, $sort);

        /** @var LengthAwarePaginator $paginator */
        $paginator = $query->with(['category', 'images', 'brand', 'promotions'])->paginate($perPage, ['*'], 'page', $page);

        $priceRow = $this->buildQuery($baseIds, $selectedCategorySlugs, $selectedBrandSlugs, $condition, null, null, $inStock, $attrs, $categories)
            ->whereNotNull('price')
            ->selectRaw('MIN(price) as min_price, MAX(price) as max_price')
            ->first();

        return [
            'products' => $paginator->items(),
            'meta' => [
                'total' => $paginator->total(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'sort' => $sort,
            ],
            'facets' => $this->facets($root, $baseIds, $selectedCategorySlugs, $selectedBrandSlugs, $condition, $minPrice, $maxPrice, $inStock, $attrs, $categories),
            'price_bounds' => [
                'min' => (int) ($priceRow->min_price ?? 0),
                'max' => (int) ($priceRow->max_price ?? 0),
            ],
            'settings' => $settings,
        ];
    }

    protected function buildQuery(
        ?array $baseIds,
        array $selectedCategorySlugs,
        array $selectedBrandSlugs,
        mixed $condition,
        mixed $minPrice,
        mixed $maxPrice,
        ?bool $inStock,
        array $attrs,
        CategoryService $categories
    ): Builder {
        $query = Product::query()->published();

        // Cases cochées dans le filtre catégorie : elles remplacent le scope de page.
        if ($selectedCategorySlugs !== []) {
            $ids = $this->resolveCategoryIdsFromSlugs($selectedCategorySlugs, $categories);
            if ($ids !== []) {
                $query->whereIn('category_id', $ids);
            } else {
                $query->whereRaw('1 = 0');
            }
        } elseif ($baseIds !== null) {
            $query->whereIn('category_id', $baseIds);
        }

        if ($selectedBrandSlugs !== []) {
            $query->whereHas('brand', fn ($q) => $q->whereIn('slug', $selectedBrandSlugs));
        }

        if ($condition) {
            $query->where('condition', $condition);
        }

        if ($minPrice !== null && $minPrice !== '') {
            $query->where('price', '>=', (int) $minPrice);
        }
        if ($maxPrice !== null && $maxPrice !== '') {
            $query->where('price', '<=', (int) $maxPrice);
        }

        if ($inStock === true) {
            $query->where(function ($q) {
                $q->whereNull('stock_quantity')->orWhere('stock_quantity', '>', 0);
            });
        } elseif ($inStock === false) {
            $query->where('stock_quantity', 0);
        }

        foreach ($attrs as $attrId => $value) {
            $query->whereHas('attributeValues', function ($q) use ($attrId, $value) {
                $q->where('category_attribute_id', $attrId);
                if (is_array($value)) {
                    if (isset($value['min'])) {
                        $q->whereRaw('CAST(value AS INTEGER) >= ?', [(int) $value['min']]);
                    }
                    if (isset($value['max'])) {
                        $q->whereRaw('CAST(value AS INTEGER) <= ?', [(int) $value['max']]);
                    }
                    if (isset($value['in'])) {
                        $q->whereIn('value', $value['in']);
                    }
                } else {
                    $q->where('value', $value);
                }
            });
        }

        return $query;
    }

    /** @return list<int> */
    protected function resolveCategoryIdsFromSlugs(array $slugs, CategoryService $categories): array
    {
        $ids = [];
        $map = $this->categoriesBySlug();
        foreach ($slugs as $slug) {
            $cat = $map[$slug] ?? null;
            if ($cat && $cat->is_active) {
                $ids = array_merge($ids, $categories->descendantIds($cat));
            }
        }

        return array_values(array_unique($ids));
    }

    /** @return array<string, Category> */
    protected function categoriesBySlug(): array
    {
        if ($this->categoriesBySlug !== null) {
            return $this->categoriesBySlug;
        }

        $this->categoriesBySlug = Category::query()
            ->get(['id', 'parent_id', 'name', 'slug', 'is_active', 'display_order', 'popular_order'])
            ->keyBy('slug')
            ->all();

        return $this->categoriesBySlug;
    }

    protected function applySort(Builder $query, string $sort): void
    {
        $settings = $this->settings();
        $popularity = $settings['popularity_logic'] ?? 'quotes';

        match ($sort) {
            'price_asc' => $query->orderBy('price'),
            'price_desc' => $query->orderByDesc('price'),
            'popular' => $popularity === 'manual'
                ? $query->orderByDesc('id')
                : $query->withCount('quotes')->orderByDesc('quotes_count')->latest(),
            'promo' => $query->orderByRaw('CASE WHEN promo_price IS NOT NULL AND promo_price < price THEN 0 ELSE 1 END')
                ->orderByRaw('CASE WHEN promo_price IS NOT NULL THEN (price - promo_price) * 100.0 / NULLIF(price,0) ELSE 0 END DESC')
                ->latest(),
            'newest' => $query->latest(),
            'default' => $query->latest(),
            default => $query->latest(),
        };
    }

    protected function facets(
        ?Category $root,
        ?array $baseIds,
        array $selectedCategorySlugs,
        array $selectedBrandSlugs,
        mixed $condition,
        mixed $minPrice,
        mixed $maxPrice,
        ?bool $inStock,
        array $attrs,
        CategoryService $categories
    ): array {
        $settings = $this->settings();
        $orderAlpha = ($settings['category_order'] ?? 'manual') === 'alpha';

        // 1 query : counts par category_id (autres filtres appliqués, pas le filtre catégorie).
        $rawCategoryCounts = $this->buildQuery(null, [], $selectedBrandSlugs, $condition, $minPrice, $maxPrice, $inStock, $attrs, $categories)
            ->selectRaw('category_id, COUNT(*) as aggregate')
            ->groupBy('category_id')
            ->pluck('aggregate', 'category_id')
            ->map(fn ($v) => (int) $v)
            ->all();

        $sumDescendants = function (Category $cat) use ($categories, $rawCategoryCounts): int {
            $total = 0;
            foreach ($categories->descendantIds($cat) as $id) {
                $total += $rawCategoryCounts[$id] ?? 0;
            }

            return $total;
        };

        $categoryNodes = Category::query()
            ->whereNull('parent_id')
            ->where('is_active', true)
            ->when(
                $orderAlpha,
                fn ($q) => $q->orderBy('name'),
                fn ($q) => $q->orderBy('display_order')->orderBy('name')
            )
            ->with([
                'children' => function ($q) use ($orderAlpha) {
                    $q->where('is_active', true);
                    if ($orderAlpha) {
                        $q->orderBy('name');
                    } else {
                        $q->orderBy('display_order')->orderBy('name');
                    }
                },
            ])
            ->get();

        $categoryFacets = $categoryNodes->map(function (Category $cat) use ($sumDescendants) {
            $children = ($cat->children ?? collect())->map(function (Category $child) use ($sumDescendants) {
                return [
                    'id' => $child->id,
                    'name' => $child->name,
                    'slug' => $child->slug,
                    'count' => $sumDescendants($child),
                ];
            })->values()->all();

            return [
                'id' => $cat->id,
                'name' => $cat->name,
                'slug' => $cat->slug,
                'count' => $sumDescendants($cat),
                'children' => $children,
            ];
        })->values()->all();

        $categoryFacets = $this->applyCategoryFilterConfig($categoryFacets);

        // Marques : 1 GROUP BY brand_id
        $brandCounts = $this->buildQuery($baseIds, $selectedCategorySlugs, [], $condition, $minPrice, $maxPrice, $inStock, $attrs, $categories)
            ->whereNotNull('brand_id')
            ->selectRaw('brand_id, COUNT(*) as aggregate')
            ->groupBy('brand_id')
            ->pluck('aggregate', 'brand_id')
            ->map(fn ($v) => (int) $v)
            ->all();

        $brands = Brand::query()
            ->whereIn('id', array_keys($brandCounts))
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(fn (Brand $b) => [
                'id' => $b->id,
                'name' => $b->name,
                'slug' => $b->slug,
                'count' => $brandCounts[$b->id] ?? 0,
            ])
            ->values()
            ->all();

        // Conditions : 1 GROUP BY
        $conditionCounts = $this->buildQuery($baseIds, $selectedCategorySlugs, $selectedBrandSlugs, null, $minPrice, $maxPrice, $inStock, $attrs, $categories)
            ->whereNotNull('condition')
            ->selectRaw('`condition`, COUNT(*) as aggregate')
            ->groupBy('condition')
            ->pluck('aggregate', 'condition')
            ->map(fn ($v) => (int) $v)
            ->all();

        $conditions = [];
        foreach (['neuf' => 'Neuf', 'reconditionne' => 'Reconditionné'] as $value => $label) {
            $c = $conditionCounts[$value] ?? 0;
            if ($c > 0) {
                $conditions[] = ['value' => $value, 'label' => $label, 'count' => $c];
            }
        }

        // Dispo : 1 query avec 2 compteurs conditionnels
        $stockRow = $this->buildQuery($baseIds, $selectedCategorySlugs, $selectedBrandSlugs, $condition, $minPrice, $maxPrice, null, $attrs, $categories)
            ->selectRaw(
                'SUM(CASE WHEN stock_quantity IS NULL OR stock_quantity > 0 THEN 1 ELSE 0 END) as in_stock, '.
                'SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as out_stock'
            )
            ->first();

        $availability = [
            ['value' => '1', 'label' => 'En stock', 'count' => (int) ($stockRow->in_stock ?? 0)],
            ['value' => '0', 'label' => 'Sur commande', 'count' => (int) ($stockRow->out_stock ?? 0)],
        ];

        $attributes = [];
        if ($root) {
            $filterable = $root->attributes()->with('options')->where('is_filterable', true)->get();
            foreach ($filterable as $attr) {
                $attrsWithoutThis = $attrs;
                unset($attrsWithoutThis[$attr->id]);

                $valueCounts = $this->buildQuery($baseIds, $selectedCategorySlugs, $selectedBrandSlugs, $condition, $minPrice, $maxPrice, $inStock, $attrsWithoutThis, $categories)
                    ->join('product_attribute_values as pav', 'pav.product_id', '=', 'products.id')
                    ->where('pav.category_attribute_id', $attr->id)
                    ->selectRaw('pav.value, COUNT(DISTINCT products.id) as aggregate')
                    ->groupBy('pav.value')
                    ->pluck('aggregate', 'value')
                    ->map(fn ($v) => (int) $v)
                    ->all();

                $options = [];
                foreach ($attr->options as $opt) {
                    $options[] = [
                        'id' => $opt->id,
                        'value' => $opt->value,
                        'count' => $valueCounts[(string) $opt->value] ?? 0,
                    ];
                }
                $attributes[] = [
                    'id' => $attr->id,
                    'name' => $attr->name,
                    'slug' => $attr->slug,
                    'field_type' => $attr->field_type,
                    'options' => $options,
                ];
            }
        }

        return [
            'categories' => $categoryFacets,
            'brands' => $brands,
            'conditions' => $conditions,
            'availability' => $availability,
            'attributes' => $attributes,
        ];
    }

    protected function arrayParam(array $params, string $key): array
    {
        $value = $params[$key] ?? null;
        if ($value === null || $value === '') {
            return [];
        }
        if (is_array($value)) {
            return array_values(array_filter(array_map('strval', $value)));
        }

        return array_values(array_filter(array_map('trim', explode(',', (string) $value))));
    }

    protected function attributeParams(array $params): array
    {
        $out = [];
        foreach ($params as $key => $value) {
            if (! is_string($key) || ! str_starts_with($key, 'attr_')) {
                continue;
            }
            $rest = substr($key, 5);
            if (str_ends_with($rest, '_min')) {
                $id = (int) substr($rest, 0, -4);
                $out[$id]['min'] = $value;
            } elseif (str_ends_with($rest, '_max')) {
                $id = (int) substr($rest, 0, -4);
                $out[$id]['max'] = $value;
            } else {
                $id = (int) $rest;
                $vals = is_array($value) ? $value : explode(',', (string) $value);
                $out[$id]['in'] = array_values(array_filter(array_map('strval', $vals)));
            }
        }

        return $out;
    }
}
