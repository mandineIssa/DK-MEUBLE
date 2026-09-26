<?php

namespace App\Services;

use App\Models\Category;
use App\Models\MenuItem;
use App\Models\MenuSection;
use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

class NavigationService
{
    public const CACHE_KEY = 'navigation:menu:v1';

    public static function defaultSettings(): array
    {
        return [
            'columns' => 3,
            'mobile_mode' => 'accordion', // accordion|list
            'show_icons' => false,
            'show_product_counts' => false,
        ];
    }

    public function settings(): array
    {
        $stored = Setting::query()->where('key', 'navigation')->value('value');
        $value = is_array($stored) ? $stored : [];

        return array_replace_recursive(self::defaultSettings(), $value);
    }

    public function updateSettings(array $payload): array
    {
        $merged = array_replace_recursive($this->settings(), $payload);
        Setting::query()->updateOrCreate(['key' => 'navigation'], ['value' => $merged]);
        $this->forgetCache();

        return $this->settings();
    }

    public function forgetCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    public function ensureDefaults(): void
    {
        if (MenuSection::query()->exists()) {
            return;
        }

        $this->rebuildFromCategories(false);
    }

    /**
     * Reconstruit le méga-menu depuis la taxonomie.
     * Sections = racines ; items = enfants (blocs) + petits-enfants imbriqués.
     *
     * @return array{sections:int,items:int}
     */
    public function rebuildFromCategories(bool $wipe = true): array
    {
        if ($wipe) {
            MenuItem::query()->delete();
            MenuSection::query()->delete();
        }

        $roots = Category::query()
            ->where('is_active', true)
            ->whereNull('parent_id')
            ->orderBy('display_order')
            ->orderBy('name')
            ->with([
                'children' => fn ($q) => $q->where('is_active', true)
                    ->orderBy('display_order')
                    ->orderBy('name')
                    ->with([
                        'children' => fn ($c) => $c->where('is_active', true)
                            ->orderBy('display_order')
                            ->orderBy('name'),
                    ]),
            ])
            ->get();

        $sectionCount = 0;
        $itemCount = 0;

        foreach ($roots as $i => $root) {
            $section = MenuSection::create([
                'label' => mb_strtoupper($root->name),
                'linked_category_id' => $root->id,
                'display_order' => ($i + 1) * 10,
                'is_active' => true,
            ]);
            $sectionCount++;

            foreach ($root->children as $j => $child) {
                $item = MenuItem::create([
                    'menu_section_id' => $section->id,
                    'parent_id' => null,
                    'label' => $child->name,
                    'linked_category_id' => $child->id,
                    'display_order' => ($j + 1) * 10,
                    'is_active' => true,
                ]);
                $itemCount++;

                foreach ($child->children as $k => $grand) {
                    MenuItem::create([
                        'menu_section_id' => $section->id,
                        'parent_id' => $item->id,
                        'label' => $grand->name,
                        'linked_category_id' => $grand->id,
                        'display_order' => ($k + 1) * 10,
                        'is_active' => true,
                    ]);
                    $itemCount++;
                }
            }
        }

        // Exceptions MasterOffice : pas de sous-menu
        MenuSection::create([
            'label' => 'DESTOCKAGE',
            'custom_url' => '/destockage',
            'display_order' => 900,
            'is_active' => true,
        ]);
        MenuSection::create([
            'label' => 'RECONDITIONNÉ',
            'custom_url' => '/reconditionne',
            'display_order' => 910,
            'is_active' => true,
        ]);
        $sectionCount += 2;

        // Colonnes adaptées aux blocs (Gros / Petits / Appareils)
        $navSettings = $this->settings();
        $navSettings['columns'] = 3;
        Setting::query()->updateOrCreate(['key' => 'navigation'], ['value' => $navSettings]);

        $this->forgetCache();

        return ['sections' => $sectionCount, 'items' => $itemCount];
    }

    public function assemble(): array
    {
        return Cache::remember(self::CACHE_KEY, 3600, function () {
            // Génération coûteuse uniquement en cas de miss cache
            $this->ensureDefaults();

            $settings = $this->settings();

            $sections = MenuSection::query()
                ->active()
                ->ordered()
                ->with([
                    'category:id,name,slug,is_active',
                    'items' => fn ($q) => $q->active()->whereNull('parent_id')->orderBy('display_order')
                        ->with([
                            'category:id,name,slug,is_active',
                            'children' => fn ($c) => $c->active()->orderBy('display_order')->with('category:id,name,slug,is_active'),
                        ]),
                ])
                ->get();

            return [
                'sections' => $sections->map(fn (MenuSection $s) => $this->serializeSection($s))->values()->all(),
                'settings' => $settings,
            ];
        });
    }

    public function brokenLinks(): array
    {
        $items = MenuItem::query()
            ->with(['category:id,name,slug,is_active', 'section:id,label'])
            ->whereNotNull('linked_category_id')
            ->get()
            ->filter(function (MenuItem $item) {
                if (! $item->category) {
                    return true;
                }

                return ! $item->category->is_active;
            })
            ->map(fn (MenuItem $item) => [
                'type' => 'item',
                'id' => $item->id,
                'label' => $item->label,
                'section' => $item->section?->label,
                'linked_category_id' => $item->linked_category_id,
                'reason' => $item->category ? 'inactive' : 'missing',
            ])
            ->values()
            ->all();

        $sections = MenuSection::query()
            ->with('category:id,name,slug,is_active')
            ->whereNotNull('linked_category_id')
            ->get()
            ->filter(function (MenuSection $s) {
                if (! $s->category) {
                    return true;
                }

                return ! $s->category->is_active;
            })
            ->map(fn (MenuSection $s) => [
                'type' => 'section',
                'id' => $s->id,
                'label' => $s->label,
                'section' => $s->label,
                'linked_category_id' => $s->linked_category_id,
                'reason' => $s->category ? 'inactive' : 'missing',
            ])
            ->values()
            ->all();

        return array_values(array_merge($sections, $items));
    }

    protected function serializeSection(MenuSection $s): array
    {
        $href = $this->resolveHref($s->custom_url, $s->category);

        return [
            'id' => $s->id,
            'label' => $s->label,
            'icon' => $s->icon,
            'href' => $href,
            'has_panel' => $s->items->isNotEmpty(),
            'linked_category' => $s->category ? [
                'id' => $s->category->id,
                'name' => $s->category->name,
                'slug' => $s->category->slug,
            ] : null,
            'items' => $s->items->map(fn (MenuItem $item) => $this->serializeItem($item))->values()->all(),
        ];
    }

    protected function serializeItem(MenuItem $item): array
    {
        return [
            'id' => $item->id,
            'label' => $item->label,
            'href' => $this->resolveHref($item->custom_url, $item->category),
            'linked_category' => $item->category ? [
                'id' => $item->category->id,
                'name' => $item->category->name,
                'slug' => $item->category->slug,
            ] : null,
            'children' => $item->children->map(fn (MenuItem $child) => $this->serializeItem($child))->values()->all(),
        ];
    }

    protected function resolveHref(?string $customUrl, ?Category $category): ?string
    {
        if ($customUrl) {
            return $customUrl;
        }
        if ($category && $category->is_active) {
            return '/categorie/'.$category->slug;
        }

        return null;
    }
}
