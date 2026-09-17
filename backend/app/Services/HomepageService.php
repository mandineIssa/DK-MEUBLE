<?php

namespace App\Services;

use App\Models\Brand;
use App\Models\Category;
use App\Models\HomepageFeaturedProduct;
use App\Models\HomepageSection;
use App\Models\HomepageSectionItem;
use App\Models\HomepageSlide;
use App\Models\Product;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class HomepageService
{
    public const CACHE_KEY = 'homepage:assembled:v1';

    public function forgetCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    public function ensureDefaults(): void
    {
        if (HomepageSection::query()->exists()) {
            return;
        }

        $hero = HomepageSection::create([
            'type' => 'hero',
            'title' => 'Bannière principale',
            'display_order' => 10,
            'is_active' => true,
        ]);

        HomepageSlide::create([
            'section_id' => $hero->id,
            'image_desktop' => 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=2000&q=80',
            'image_mobile' => null,
            'title' => 'Électroménager',
            'subtitle' => 'Maison • Bureau • Entreprise',
            'link_url' => '/produits',
            'display_order' => 0,
            'is_active' => true,
        ]);

        HomepageSlide::create([
            'section_id' => $hero->id,
            'image_desktop' => 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=2000&q=80',
            'title' => 'Meubles & Armoires',
            'subtitle' => 'Qualité et livraison partout au Sénégal',
            'link_url' => '/categories',
            'display_order' => 1,
            'is_active' => true,
        ]);

        $trust = HomepageSection::create([
            'type' => 'trust_badges',
            'title' => 'Réassurance',
            'display_order' => 20,
            'is_active' => true,
        ]);

        $trustDefaults = [
            ['Livraison', 'Partout au Sénégal', 'truck', '/contact'],
            ['Garantie', 'Produits garantis', 'shield', null],
            ['Service client', 'Conseil & SAV', 'headset', '/contact'],
            ['Paiement sécurisé', 'Wave, OM, espèces', 'lock', null],
        ];
        foreach ($trustDefaults as $i => [$title, $sub, $icon, $link]) {
            HomepageSectionItem::create([
                'section_id' => $trust->id,
                'item_type' => 'trust',
                'title' => $title,
                'subtitle' => $sub,
                'icon' => $icon,
                'link_url' => $link,
                'display_order' => $i,
                'is_active' => true,
            ]);
        }

        $grid = HomepageSection::create([
            'type' => 'category_grid',
            'title' => 'Catégories phares',
            'display_order' => 30,
            'is_active' => true,
        ]);

        $popular = Category::query()
            ->where('is_active', true)
            ->where('is_popular', true)
            ->orderBy('popular_order')
            ->limit(8)
            ->get();

        if ($popular->isEmpty()) {
            $popular = Category::query()
                ->where('is_active', true)
                ->whereNull('parent_id')
                ->orderBy('display_order')
                ->limit(6)
                ->get();
        }

        foreach ($popular as $i => $cat) {
            HomepageSectionItem::create([
                'section_id' => $grid->id,
                'item_type' => 'category_tile',
                'title' => $cat->name,
                'category_id' => $cat->id,
                'image_url' => $cat->image_path,
                'link_url' => '/categorie/'.$cat->slug,
                'display_order' => $i,
                'is_active' => true,
            ]);
        }

        $firstCat = Category::query()->where('is_active', true)->orderBy('display_order')->first();
        HomepageSection::create([
            'type' => 'product_carousel',
            'title' => $firstCat?->name ?: 'Nos produits',
            'category_id' => $firstCat?->id,
            'banner_link' => $firstCat ? '/categorie/'.$firstCat->slug : '/produits',
            'selection_mode' => 'recent',
            'products_limit' => 8,
            'display_order' => 40,
            'is_active' => true,
        ]);

        HomepageSection::create([
            'type' => 'product_carousel',
            'title' => 'Promotions',
            'selection_mode' => 'on_sale',
            'banner_link' => '/promo',
            'products_limit' => 8,
            'display_order' => 50,
            'is_active' => true,
        ]);

        HomepageSection::create([
            'type' => 'brands',
            'title' => 'Nos marques',
            'display_order' => 60,
            'is_active' => true,
        ]);

        HomepageSection::create([
            'type' => 'newsletter',
            'title' => 'Newsletter',
            'subtitle' => 'Recevez nos offres et nouveautés',
            'display_order' => 70,
            'is_active' => true,
            'meta' => [
                'cta_label' => "S'inscrire",
            ],
        ]);

        HomepageSection::create([
            'type' => 'socials',
            'title' => 'Suivez-nous',
            'display_order' => 80,
            'is_active' => true,
        ]);
    }

    public function assemble(): array
    {
        $this->ensureDefaults();

        return Cache::remember(self::CACHE_KEY, 300, function () {
            $settings = SiteContentService::allSettingsStatic();
            $homepage = is_array($settings['homepage'] ?? null) ? $settings['homepage'] : [];

            $sections = HomepageSection::query()
                ->active()
                ->orderBy('display_order')
                ->with([
                    'category:id,name,slug,image_path',
                    'slides' => fn ($q) => $q->currentlyVisible()->orderBy('display_order'),
                    'items' => fn ($q) => $q->where('is_active', true)->orderBy('display_order')->with('category:id,name,slug,image_path'),
                    'featuredProducts.product' => fn ($q) => $q->published()->with(['category', 'images', 'brand', 'promotions']),
                ])
                ->get();

            $payload = [];
            foreach ($sections as $section) {
                $payload[] = $this->serializeSection($section);
            }

            return [
                'sections' => $payload,
                'nav_secondary' => $this->navSecondary($homepage),
                'newsletter' => array_merge([
                    'enabled' => true,
                    'title' => 'Newsletter',
                    'subtitle' => 'Recevez nos offres et nouveautés',
                    'cta_label' => "S'inscrire",
                    'provider' => 'internal',
                ], is_array($homepage['newsletter'] ?? null) ? $homepage['newsletter'] : []),
                'whatsapp_widget' => array_merge([
                    'enabled' => true,
                    'phone' => '',
                    'message' => 'Bonjour, je souhaite des informations sur vos produits.',
                    'agent_image' => '',
                ], is_array($homepage['whatsapp_widget'] ?? null) ? $homepage['whatsapp_widget'] : []),
                'footer' => [
                    'about' => $homepage['footer_about'] ?? 'DK MEUBLE — Meubles & électroménager à Dakar. Qualité, conseil et livraison partout au Sénégal.',
                    'info_links' => $homepage['footer_info_links'] ?? [
                        ['label' => 'À propos', 'href' => '/a-propos', 'enabled' => true],
                        ['label' => 'Contact', 'href' => '/contact', 'enabled' => true],
                        ['label' => 'Tous les produits', 'href' => '/produits', 'enabled' => true],
                        ['label' => 'Politique de confidentialité', 'href' => '/legal', 'enabled' => true],
                        ['label' => 'Showrooms', 'href' => '/showrooms', 'enabled' => true],
                    ],
                    'agency_credit' => $homepage['agency_credit'] ?? '',
                    'payment_logos' => $settings['payment_logos'] ?? [],
                    'contacts_services' => $settings['contacts_services'] ?? [],
                ],
                'socials' => $settings['socials'] ?? [],
                'contact' => $settings['contact'] ?? [],
                'brand' => $settings['brand'] ?? [],
            ];
        });
    }

    public function productsForSection(HomepageSection $section): array
    {
        $limit = max(1, min(20, (int) ($section->products_limit ?: 8)));
        $mode = $section->selection_mode ?: 'recent';

        if ($mode === 'manual') {
            $ids = HomepageFeaturedProduct::query()
                ->where('section_id', $section->id)
                ->orderBy('display_order')
                ->pluck('product_id')
                ->all();

            if (empty($ids)) {
                return [];
            }

            $products = Product::query()
                ->published()
                ->whereIn('id', $ids)
                ->with(['category', 'images', 'brand', 'promotions'])
                ->get()
                ->sortBy(fn ($p) => array_search($p->id, $ids, true))
                ->values();

            return $products->all();
        }

        $query = Product::query()
            ->published()
            ->with(['category', 'images', 'brand', 'promotions']);

        if ($section->category_id) {
            $cat = Category::query()->find($section->category_id);
            if ($cat) {
                $query->whereIn('category_id', app(CategoryService::class)->descendantIds($cat));
            } else {
                $query->where('category_id', $section->category_id);
            }
        }

        match ($mode) {
            'on_sale' => $query->where(function ($q) {
                $q->whereHas('promotions', fn ($p) => $p->publicVisible())
                    ->orWhere(function ($w) {
                        $w->whereNotNull('promo_price')->whereColumn('promo_price', '<', 'price');
                    });
            })->latest(),
            'bestseller' => $query->withCount('quotes')->orderByDesc('quotes_count')->latest(),
            default => $query->latest(),
        };

        return $query->limit($limit)->get()->all();
    }

    protected function serializeSection(HomepageSection $section): array
    {
        $base = [
            'id' => $section->id,
            'type' => $section->type,
            'title' => $section->title,
            'subtitle' => $section->subtitle,
            'display_order' => $section->display_order,
            'banner_image' => $this->mediaUrl($section->banner_image),
            'banner_link' => $section->banner_link,
            'selection_mode' => $section->selection_mode,
            'products_limit' => $section->products_limit,
            'meta' => $section->meta ?? [],
            'category' => $section->category ? [
                'id' => $section->category->id,
                'name' => $section->category->name,
                'slug' => $section->category->slug,
            ] : null,
        ];

        return match ($section->type) {
            'hero' => array_merge($base, [
                'slides' => $section->slides->map(fn (HomepageSlide $s) => [
                    'id' => $s->id,
                    'image_desktop' => $this->mediaUrl($s->image_desktop),
                    'image_mobile' => $this->mediaUrl($s->image_mobile),
                    'title' => $s->title,
                    'subtitle' => $s->subtitle,
                    'link_url' => $s->link_url,
                    'display_order' => $s->display_order,
                ])->values()->all(),
            ]),
            'trust_badges', 'category_grid' => array_merge($base, [
                'items' => $section->items->map(fn (HomepageSectionItem $item) => [
                    'id' => $item->id,
                    'item_type' => $item->item_type,
                    'title' => $item->title ?: $item->category?->name,
                    'subtitle' => $item->subtitle,
                    'icon' => $item->icon,
                    'image_url' => $this->mediaUrl($item->image_url ?: $item->category?->image_path),
                    'link_url' => $item->link_url ?: ($item->category ? '/categorie/'.$item->category->slug : null),
                    'category' => $item->category ? [
                        'id' => $item->category->id,
                        'name' => $item->category->name,
                        'slug' => $item->category->slug,
                    ] : null,
                    'display_order' => $item->display_order,
                ])->values()->all(),
            ]),
            'product_carousel' => array_merge($base, [
                'products' => array_map(
                    fn ($p) => $p->toArray(),
                    $this->productsForSection($section)
                ),
            ]),
            'brands' => array_merge($base, [
                'brands' => Brand::query()
                    ->where('is_featured', true)
                    ->orderBy('name')
                    ->get()
                    ->map(fn (Brand $b) => [
                        'id' => $b->id,
                        'name' => $b->name,
                        'slug' => $b->slug,
                        'logo_path' => $b->logo_path,
                        'logo_url' => $this->mediaUrl($b->logo_path),
                    ])
                    ->values()
                    ->all(),
            ]),
            default => $base,
        };
    }

    protected function navSecondary(array $homepage): array
    {
        $defaults = [
            ['label' => 'Nos produits', 'href' => '/produits', 'enabled' => true, 'order' => 0],
            ['label' => 'Promotion', 'href' => '/promo', 'enabled' => true, 'order' => 1],
            ['label' => 'Reconditionné', 'href' => '/reconditionne', 'enabled' => true, 'order' => 2],
            ['label' => 'Destockage', 'href' => '/destockage', 'enabled' => true, 'order' => 3],
            ['label' => 'Services', 'href' => '/services', 'enabled' => true, 'order' => 4],
            ['label' => 'Contact', 'href' => '/contact', 'enabled' => true, 'order' => 5],
        ];

        $links = is_array($homepage['nav_secondary'] ?? null) ? $homepage['nav_secondary'] : $defaults;

        return collect($links)
            ->filter(fn ($l) => is_array($l) && ($l['enabled'] ?? true))
            ->sortBy(fn ($l) => $l['order'] ?? 0)
            ->values()
            ->all();
    }

    protected function mediaUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        $relative = Storage::disk('public')->url($path);
        if (str_starts_with($relative, 'http://') || str_starts_with($relative, 'https://')) {
            return $relative;
        }

        return rtrim((string) config('app.url'), '/').'/'.ltrim($relative, '/');
    }

    public function adminIndex(): array
    {
        $this->ensureDefaults();

        $sections = HomepageSection::query()
            ->orderBy('display_order')
            ->with([
                'category:id,name,slug',
                'slides',
                'items.category:id,name,slug',
                'featuredProducts.product:id,name,slug',
            ])
            ->get();

        $settings = SiteContentService::allSettingsStatic();

        return [
            'sections' => $sections,
            'homepage_settings' => $settings['homepage'] ?? [],
            'socials' => $settings['socials'] ?? [],
            'payment_logos' => $settings['payment_logos'] ?? [],
            'contacts_services' => $settings['contacts_services'] ?? [],
            'contact' => $settings['contact'] ?? [],
        ];
    }
}
