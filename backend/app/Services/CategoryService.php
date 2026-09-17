<?php

namespace App\Services;

use App\Models\Category;
use App\Models\CategorySlugRedirect;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CategoryService
{
    public static function defaultSettings(): array
    {
        return [
            'max_depth' => 3,
            'hide_empty' => false,
            'show_breadcrumb' => true,
            'default_sort' => 'newest', // newest|price_asc|price_desc|promo
        ];
    }

    public function settings(): array
    {
        $stored = Setting::query()->where('key', 'categories')->value('value');
        $value = is_array($stored) ? $stored : [];

        return array_replace_recursive(self::defaultSettings(), $value);
    }

    public function updateSettings(array $payload): array
    {
        $merged = array_replace_recursive($this->settings(), $payload);
        Setting::query()->updateOrCreate(
            ['key' => 'categories'],
            ['value' => $merged]
        );

        return $this->settings();
    }

    public function uniqueSlug(string $name, ?string $slug = null, ?int $ignoreId = null): string
    {
        $base = Str::slug($slug ?: $name) ?: 'categorie';
        $candidate = $base;
        $i = 2;
        while (
            Category::query()
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->where('slug', $candidate)
                ->exists()
        ) {
            $candidate = $base.'-'.$i;
            $i++;
        }

        return $candidate;
    }

    public function depthOf(?int $parentId): int
    {
        if (! $parentId) {
            return 1;
        }
        $depth = 1;
        $current = Category::query()->find($parentId);
        while ($current?->parent_id) {
            $depth++;
            $current = Category::query()->find($current->parent_id);
            if ($depth > 10) {
                break;
            }
        }

        return $depth + 1;
    }

    public function assertParentAllowed(?int $parentId, ?int $selfId = null): void
    {
        $max = (int) $this->settings()['max_depth'];
        $depth = $this->depthOf($parentId);
        if ($depth > $max) {
            throw ValidationException::withMessages([
                'parent_id' => "Profondeur max autorisée : {$max} niveaux.",
            ]);
        }
        if ($selfId && $parentId) {
            $cursor = Category::query()->find($parentId);
            while ($cursor) {
                if ($cursor->id === $selfId) {
                    throw ValidationException::withMessages([
                        'parent_id' => 'Une catégorie ne peut pas être son propre descendant.',
                    ]);
                }
                $cursor = $cursor->parent_id ? Category::query()->find($cursor->parent_id) : null;
            }
        }
    }

    /** IDs de la catégorie + tous ses descendants. */
    /** @var array<int, list<int>>|null */
    protected ?array $childrenByParentId = null;

    public function descendantIds(Category $category): array
    {
        $this->ensureChildrenIndex();

        $ids = [$category->id];
        $queue = [$category->id];
        while ($queue !== []) {
            $parent = array_shift($queue);
            foreach ($this->childrenByParentId[$parent] ?? [] as $cid) {
                $ids[] = $cid;
                $queue[] = $cid;
            }
        }

        return $ids;
    }

    protected function ensureChildrenIndex(): void
    {
        if ($this->childrenByParentId !== null) {
            return;
        }

        $this->childrenByParentId = [];
        foreach (Category::query()->get(['id', 'parent_id']) as $row) {
            if ($row->parent_id === null) {
                continue;
            }
            $this->childrenByParentId[(int) $row->parent_id][] = (int) $row->id;
        }
    }

    public function productsCountMap(): array
    {
        return Cache::remember('categories:product_counts:v1', 120, function () {
            $counts = Product::query()
                ->published()
                ->selectRaw('category_id, count(*) as aggregate')
                ->groupBy('category_id')
                ->pluck('aggregate', 'category_id')
                ->all();

            $all = Category::query()->get(['id', 'parent_id']);
            $byParent = $all->groupBy('parent_id');
            $memo = [];

            $walk = function (int $id) use (&$walk, &$memo, $counts, $byParent): int {
                if (isset($memo[$id])) {
                    return $memo[$id];
                }
                $total = (int) ($counts[$id] ?? 0);
                foreach ($byParent->get($id, collect()) as $child) {
                    $total += $walk($child->id);
                }

                return $memo[$id] = $total;
            };

            foreach ($all as $cat) {
                $walk($cat->id);
            }

            return $memo;
        });
    }

    public function forgetTreeCache(): void
    {
        Cache::forget('categories:tree:public:v1');
        Cache::forget('categories:tree:admin:v1');
        Cache::forget('categories:product_counts:v1');
        Cache::forget('categories:popular:v1');
    }

    public function tree(bool $publicOnly = true): Collection
    {
        $key = $publicOnly ? 'categories:tree:public:v1' : 'categories:tree:admin:v1';

        return collect(Cache::remember($key, 120, function () use ($publicOnly) {
            return $this->buildTree($publicOnly);
        }));
    }

    protected function buildTree(bool $publicOnly = true): array
    {
        $settings = $this->settings();
        $counts = $this->productsCountMap();

        $query = Category::query()->orderBy('display_order')->orderBy('name');
        if ($publicOnly) {
            $query->where('is_active', true);
        }
        $flat = $query->get();

        $children = $flat->groupBy(fn ($c) => $c->parent_id ?: 0);

        $build = function ($parentKey) use (&$build, $children, $counts, $settings, $publicOnly): array {
            $nodes = [];
            foreach ($children->get($parentKey, collect()) as $cat) {
                $count = (int) ($counts[$cat->id] ?? 0);
                if ($publicOnly && ! empty($settings['hide_empty']) && $count === 0) {
                    continue;
                }
                $kids = $build($cat->id);
                $nodes[] = [
                    'id' => $cat->id,
                    'parent_id' => $cat->parent_id,
                    'name' => $cat->name,
                    'slug' => $cat->slug,
                    'icon' => $cat->icon,
                    'image_path' => $cat->image_path,
                    'description' => $cat->description,
                    'display_order' => $cat->display_order,
                    'is_active' => $cat->is_active,
                    'is_popular' => $cat->is_popular,
                    'popular_order' => $cat->popular_order,
                    'meta_title' => $cat->meta_title,
                    'meta_description' => $cat->meta_description,
                    'products_count' => $count,
                    'children' => $kids,
                ];
            }

            return $nodes;
        };

        return $build(0);
    }

    public function popular(): array
    {
        $settings = $this->settings();
        $counts = $this->productsCountMap();
        $roots = Category::query()
            ->whereNull('parent_id')
            ->where('is_active', true)
            ->where('is_popular', true)
            ->orderBy('popular_order')
            ->orderBy('display_order')
            ->get();

        $out = [];
        foreach ($roots as $root) {
            $count = (int) ($counts[$root->id] ?? 0);
            if (! empty($settings['hide_empty']) && $count === 0) {
                continue;
            }
            $children = Category::query()
                ->where('parent_id', $root->id)
                ->where('is_active', true)
                ->orderBy('display_order')
                ->get()
                ->map(function ($c) use ($counts, $settings) {
                    $cc = (int) ($counts[$c->id] ?? 0);
                    if (! empty($settings['hide_empty']) && $cc === 0) {
                        return null;
                    }

                    return [
                        'id' => $c->id,
                        'name' => $c->name,
                        'slug' => $c->slug,
                        'image_path' => $c->image_path,
                        'products_count' => $cc,
                    ];
                })
                ->filter()
                ->values()
                ->all();

            $out[] = [
                'id' => $root->id,
                'name' => $root->name,
                'slug' => $root->slug,
                'icon' => $root->icon,
                'image_path' => $root->image_path,
                'products_count' => $count,
                'children' => $children,
            ];
        }

        return $out;
    }

    public function recordSlugRedirect(string $old, string $new): void
    {
        if ($old === $new || $old === '') {
            return;
        }
        CategorySlugRedirect::query()->updateOrCreate(
            ['old_slug' => $old],
            ['new_slug' => $new]
        );
        CategorySlugRedirect::query()
            ->where('new_slug', $old)
            ->update(['new_slug' => $new]);
    }

    public function resolveSlug(string $slug): ?Category
    {
        $cat = Category::query()->where('slug', $slug)->first();
        if ($cat) {
            return $cat;
        }

        return null;
    }

    public function redirectFor(string $slug): ?string
    {
        return CategorySlugRedirect::query()->where('old_slug', $slug)->value('new_slug');
    }

    public function reassignAndDelete(Category $category, ?int $moveToId): void
    {
        $productCount = $category->products()->count();
        $childCount = $category->children()->count();

        if ($productCount > 0) {
            if (! $moveToId || $moveToId === $category->id) {
                throw ValidationException::withMessages([
                    'move_to_id' => 'Choisissez une catégorie de destination pour reclasser les produits.',
                ]);
            }
            if (! Category::query()->whereKey($moveToId)->exists()) {
                throw ValidationException::withMessages([
                    'move_to_id' => 'Catégorie de destination introuvable.',
                ]);
            }
            Product::query()->where('category_id', $category->id)->update(['category_id' => $moveToId]);
        }

        if ($childCount > 0) {
            if (! $moveToId) {
                throw ValidationException::withMessages([
                    'move_to_id' => 'Choisissez une catégorie parente pour les sous-catégories.',
                ]);
            }
            Category::query()->where('parent_id', $category->id)->update(['parent_id' => $moveToId === $category->id ? null : $moveToId]);
        }

        $category->delete();
    }

    /**
     * Arborescence MasterOffice — Électroménager en 3 blocs (style Jumia), autres racines à 2 niveaux.
     *
     * @return array{created:int,updated:int,parents:array<int,string>}
     */
    public function seedMasterOfficeCatalog(): array
    {
        $catalog = [
            [
                'name' => 'Électroménager',
                'slug' => 'electromenager',
                'popular' => true,
                'children' => [
                    [
                        'name' => 'Gros électroménager',
                        'slug' => 'gros-electromenager',
                        'children' => [
                            'Réfrigérateurs', 'Congélateurs', 'Cuisinières', 'Splits-Climatiseur',
                            'Machine à Laver', 'Lave Vaisselle', 'Chauffe Eau', 'Hotte de Cuisine',
                            'Mini frigo', 'Distributeur de glaçons', 'Supports Réfrigérateurs',
                            'Accessoires de Cuisinières', 'Accessoires de montage splits',
                            'Purificateur d\'air', 'Ventilateur',
                        ],
                    ],
                    [
                        'name' => 'Petits électroménager',
                        'slug' => 'petits-electromenager',
                        'children' => [
                            'Bouilloire', 'Mixeurs', 'Air Fryer', 'Micro-onde', 'Machine à Café',
                            'Capsule machine à café', 'Friteuse', 'Grille Pain', 'Sandwich Maker',
                            'Juice Maker', 'Hachoir', 'Batteuses', 'Four Électrique',
                            'Plaque de Cuisson', 'Plaque Chauffante', 'Cuiseur de riz', 'Thermos',
                            'Barbecue', 'Fontaine à Eau',
                        ],
                    ],
                    [
                        'name' => 'Appareils ménagers',
                        'slug' => 'appareils-menagers',
                        'children' => [
                            'Aspirateur', 'Fer à Repasser', 'Défroisseur', 'Tueur d\'insecte',
                            'Appareils de cuisine', 'Appareils de santé et de beauté',
                            'Luminaires & Éclairage',
                        ],
                    ],
                ],
            ],
            [
                'name' => 'Mobilier de maison',
                'slug' => 'meubles',
                'popular' => true,
                'children' => [
                    'Décorations de maison', 'Tables de coin', 'Salon en cuir', 'Tables téléviseur',
                    'Banquette Chambre à Coucher', 'Matelas', 'Salon en tissu', 'Tables à manger',
                    'Buffet', 'Meubles TV', 'Tables basses', 'Meubles chambres à coucher',
                    'Chaises table à manger', 'Consoles', 'Vaisseliers', 'Canapé',
                    'Chauffeuse 1 Place', 'Chambres à coucher adulte', 'Coiffeuse de lit',
                    'Lampe', 'Chambres à coucher enfant', 'Meubles de jardin',
                    'Armoire Chambre à Coucher', 'Lit', 'Salon Angle en Tissu', 'Salon Angle en cuir',
                ],
            ],
            [
                'name' => 'Mobilier de bureau',
                'slug' => 'bureaux',
                'popular' => true,
                'children' => [
                    'Accessoires Divers', 'Banquettes', 'Bureaux', 'Chaise de Cérémonie',
                    'Chauffeuse de Bureau', 'Caissons', 'Chaises de Bureau', 'Coffres forts',
                    'Comptoir de réception', 'Fauteuils de Bureau', 'Lampes de bureau',
                    'Meubles de rangement', 'Rangements métalliques', 'Pupitres de conférence',
                    'Salons de bureau', 'Station de Travail', 'Table de Réunion', 'Tables de Bureau',
                    'Table Basse de Bureau', 'Table Coin de Bureau',
                ],
            ],
            [
                'name' => 'Électronique & TV',
                'slug' => 'tv-audio',
                'popular' => false,
                'children' => [
                    'Téléviseur', 'Barre De Son', 'Home Théâtre-Cinéma', 'Support Téléviseur',
                    'Casque', 'Microphones', 'Tablettes', 'Téléphones et Accessoires',
                    'Radio', 'Régulateur de Tension', 'Lampe led',
                ],
            ],
        ];

        $created = 0;
        $updated = 0;
        $parents = [];

        $bump = function (Category $cat) use (&$created, &$updated): void {
            $cat->wasRecentlyCreated ? $created++ : $updated++;
        };

        $upsertChild = function (Category $parent, string $childName, int $order, ?string $forcedSlug = null) use ($bump): Category {
            $baseSlug = $forcedSlug ?: (Str::slug($childName) ?: 'categorie');
            $slug = $baseSlug;

            // Ne jamais réécrire la catégorie parente via collision de slug (ex. enfant « Bureaux »)
            if ($slug === $parent->slug) {
                $slug = $parent->slug.'-'.($baseSlug === $parent->slug ? 'items' : $baseSlug);
            }

            $existing = Category::query()->where('slug', $slug)->first();
            if ($existing && (int) $existing->id === (int) $parent->id) {
                $slug = $parent->slug.'-items';
                $existing = Category::query()->where('slug', $slug)->first();
            }

            if ($existing && (int) $existing->parent_id !== (int) $parent->id) {
                // Réutilise le slug existant (produits déjà liés) en déplaçant sous le bon parent
                if (! $forcedSlug && (int) $existing->id !== (int) $parent->id) {
                    $existing->update([
                        'name' => $childName,
                        'parent_id' => $parent->id,
                        'display_order' => $order,
                        'is_active' => true,
                    ]);
                    $bump($existing);

                    return $existing->fresh();
                }
                $slug = $parent->slug.'-'.$baseSlug;
            }

            $child = Category::query()->updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $childName,
                    'parent_id' => $parent->id,
                    'display_order' => $order,
                    'is_active' => true,
                    'is_popular' => false,
                ]
            );
            $bump($child);

            return $child;
        };

        foreach ($catalog as $i => $block) {
            $parent = Category::query()->updateOrCreate(
                ['slug' => $block['slug']],
                [
                    'name' => $block['name'],
                    'parent_id' => null,
                    'display_order' => ($i + 1) * 10,
                    'is_active' => true,
                    'is_popular' => (bool) $block['popular'],
                    'popular_order' => $i + 1,
                    'description' => $block['name'].' professionnel à Dakar — large choix chez DK MEUBLE.',
                ]
            );
            $parents[$parent->id] = $parent->name;
            $bump($parent);

            foreach ($block['children'] as $j => $childDef) {
                // Groupe (3e niveau) ou feuille (2 niveaux)
                if (is_array($childDef)) {
                    $group = Category::query()->updateOrCreate(
                        ['slug' => $childDef['slug']],
                        [
                            'name' => $childDef['name'],
                            'parent_id' => $parent->id,
                            'display_order' => ($j + 1) * 10,
                            'is_active' => true,
                            'is_popular' => false,
                            'description' => $childDef['name'].' — DK MEUBLE Dakar.',
                        ]
                    );
                    $bump($group);

                    foreach ($childDef['children'] as $k => $leafName) {
                        $upsertChild($group, $leafName, ($k + 1) * 10);
                    }
                } else {
                    $upsertChild($parent, $childDef, ($j + 1) * 10);
                }
            }
        }

        // Profondeur 3 pour permettre les blocs électroménager
        $catSettings = $this->settings();
        $catSettings['max_depth'] = 3;
        Setting::query()->updateOrCreate(['key' => 'categories'], ['value' => $catSettings]);
        $this->forgetTreeCache();

        return compact('created', 'updated', 'parents');
    }
}
