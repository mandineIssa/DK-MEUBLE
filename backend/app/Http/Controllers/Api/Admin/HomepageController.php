<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\HomepageFeaturedProduct;
use App\Models\HomepageSection;
use App\Models\HomepageSectionItem;
use App\Models\HomepageSlide;
use App\Models\NewsletterSubscriber;
use App\Services\HomepageService;
use App\Services\SiteContentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HomepageController extends Controller
{
    public function index(HomepageService $homepage): JsonResponse
    {
        return response()->json($homepage->adminIndex());
    }

    public function newsletterIndex(): JsonResponse
    {
        return response()->json(
            NewsletterSubscriber::query()->latest('subscribed_at')->limit(500)->get()
        );
    }

    public function destroyNewsletter(NewsletterSubscriber $subscriber): JsonResponse
    {
        $subscriber->delete();

        return response()->json(null, 204);
    }

    public function storeSection(Request $request, HomepageService $homepage): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'in:hero,trust_badges,category_grid,product_carousel,brands,newsletter,socials'],
            'title' => ['nullable', 'string', 'max:190'],
            'subtitle' => ['nullable', 'string', 'max:500'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'banner_image' => ['nullable', 'string', 'max:2048'],
            'banner_link' => ['nullable', 'string', 'max:2048'],
            'selection_mode' => ['nullable', 'in:manual,recent,bestseller,on_sale'],
            'products_limit' => ['nullable', 'integer', 'min:1', 'max:20'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'meta' => ['nullable', 'array'],
        ]);

        $max = (int) HomepageSection::query()->max('display_order');
        $data['display_order'] = $data['display_order'] ?? ($max + 10);
        $data['is_active'] = $data['is_active'] ?? true;
        $data['products_limit'] = $data['products_limit'] ?? 8;

        $section = HomepageSection::create($data);
        $homepage->forgetCache();

        return response()->json($section->load(['category', 'slides', 'items', 'featuredProducts.product']), 201);
    }

    public function updateSection(Request $request, HomepageSection $section, HomepageService $homepage): JsonResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'nullable', 'string', 'max:190'],
            'subtitle' => ['sometimes', 'nullable', 'string', 'max:500'],
            'category_id' => ['sometimes', 'nullable', 'integer', 'exists:categories,id'],
            'banner_image' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'banner_link' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'selection_mode' => ['sometimes', 'nullable', 'in:manual,recent,bestseller,on_sale'],
            'products_limit' => ['sometimes', 'integer', 'min:1', 'max:20'],
            'display_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'meta' => ['sometimes', 'nullable', 'array'],
            'featured_product_ids' => ['sometimes', 'array'],
            'featured_product_ids.*' => ['integer', 'exists:products,id'],
        ]);

        $productIds = $data['featured_product_ids'] ?? null;
        unset($data['featured_product_ids']);

        $section->update($data);

        if (is_array($productIds)) {
            HomepageFeaturedProduct::query()->where('section_id', $section->id)->delete();
            foreach (array_values($productIds) as $i => $pid) {
                HomepageFeaturedProduct::create([
                    'section_id' => $section->id,
                    'product_id' => $pid,
                    'display_order' => $i,
                ]);
            }
        }

        $homepage->forgetCache();

        return response()->json($section->fresh()->load(['category', 'slides', 'items', 'featuredProducts.product']));
    }

    public function destroySection(HomepageSection $section, HomepageService $homepage): JsonResponse
    {
        $section->delete();
        $homepage->forgetCache();

        return response()->json(null, 204);
    }

    public function reorderSections(Request $request, HomepageService $homepage): JsonResponse
    {
        $data = $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['integer', 'exists:homepage_sections,id'],
        ]);

        DB::transaction(function () use ($data) {
            foreach (array_values($data['order']) as $i => $id) {
                HomepageSection::query()->where('id', $id)->update(['display_order' => ($i + 1) * 10]);
            }
        });

        $homepage->forgetCache();

        return response()->json(['ok' => true]);
    }

    public function storeSlide(Request $request, HomepageService $homepage): JsonResponse
    {
        $data = $request->validate([
            'section_id' => ['nullable', 'integer', 'exists:homepage_sections,id'],
            'image_desktop' => ['required', 'string', 'max:2048'],
            'image_mobile' => ['nullable', 'string', 'max:2048'],
            'title' => ['nullable', 'string', 'max:190'],
            'subtitle' => ['nullable', 'string', 'max:500'],
            'link_url' => ['nullable', 'string', 'max:2048'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if (empty($data['section_id'])) {
            $hero = HomepageSection::query()->where('type', 'hero')->orderBy('display_order')->first();
            $data['section_id'] = $hero?->id;
        }

        $max = (int) HomepageSlide::query()->where('section_id', $data['section_id'])->max('display_order');
        $data['display_order'] = $data['display_order'] ?? ($max + 1);
        $data['is_active'] = $data['is_active'] ?? true;

        $slide = HomepageSlide::create($data);
        $homepage->forgetCache();

        return response()->json($slide, 201);
    }

    public function updateSlide(Request $request, HomepageSlide $slide, HomepageService $homepage): JsonResponse
    {
        $data = $request->validate([
            'image_desktop' => ['sometimes', 'string', 'max:2048'],
            'image_mobile' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'title' => ['sometimes', 'nullable', 'string', 'max:190'],
            'subtitle' => ['sometimes', 'nullable', 'string', 'max:500'],
            'link_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'display_order' => ['sometimes', 'integer', 'min:0'],
            'start_date' => ['sometimes', 'nullable', 'date'],
            'end_date' => ['sometimes', 'nullable', 'date'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $slide->update($data);
        $homepage->forgetCache();

        return response()->json($slide->fresh());
    }

    public function destroySlide(HomepageSlide $slide, HomepageService $homepage): JsonResponse
    {
        $slide->delete();
        $homepage->forgetCache();

        return response()->json(null, 204);
    }

    public function uploadSlideImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'max:5120'],
            'kind' => ['nullable', 'in:desktop,mobile,banner,item,payment,agent'],
        ]);

        $kind = $request->input('kind', 'desktop');
        $path = $request->file('image')->store('homepage/'.$kind, 'public');

        return response()->json(['path' => $path, 'url' => \Storage::disk('public')->url($path)]);
    }

    public function storeItem(Request $request, HomepageService $homepage): JsonResponse
    {
        $data = $request->validate([
            'section_id' => ['required', 'integer', 'exists:homepage_sections,id'],
            'item_type' => ['nullable', 'string', 'max:40'],
            'title' => ['nullable', 'string', 'max:190'],
            'subtitle' => ['nullable', 'string', 'max:500'],
            'icon' => ['nullable', 'string', 'max:80'],
            'image_url' => ['nullable', 'string', 'max:2048'],
            'link_url' => ['nullable', 'string', 'max:2048'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'meta' => ['nullable', 'array'],
        ]);

        $max = (int) HomepageSectionItem::query()->where('section_id', $data['section_id'])->max('display_order');
        $data['display_order'] = $data['display_order'] ?? ($max + 1);
        $data['is_active'] = $data['is_active'] ?? true;
        $data['item_type'] = $data['item_type'] ?? 'generic';

        $item = HomepageSectionItem::create($data);
        $homepage->forgetCache();

        return response()->json($item->load('category'), 201);
    }

    public function updateItem(Request $request, HomepageSectionItem $item, HomepageService $homepage): JsonResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'nullable', 'string', 'max:190'],
            'subtitle' => ['sometimes', 'nullable', 'string', 'max:500'],
            'icon' => ['sometimes', 'nullable', 'string', 'max:80'],
            'image_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'link_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'category_id' => ['sometimes', 'nullable', 'integer', 'exists:categories,id'],
            'display_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'meta' => ['sometimes', 'nullable', 'array'],
        ]);

        $item->update($data);
        $homepage->forgetCache();

        return response()->json($item->fresh()->load('category'));
    }

    public function destroyItem(HomepageSectionItem $item, HomepageService $homepage): JsonResponse
    {
        $item->delete();
        $homepage->forgetCache();

        return response()->json(null, 204);
    }

    public function updateSettings(Request $request, SiteContentService $content, HomepageService $homepage): JsonResponse
    {
        $data = $request->validate([
            'homepage' => ['sometimes', 'array'],
            'socials' => ['sometimes', 'array'],
            'payment_logos' => ['sometimes', 'array'],
            'contacts_services' => ['sometimes', 'array'],
            'contact' => ['sometimes', 'array'],
            'footer' => ['sometimes', 'array'],
        ]);

        $settings = $content->updateSettings($data);
        $homepage->forgetCache();

        return response()->json([
            'homepage_settings' => $settings['homepage'] ?? [],
            'socials' => $settings['socials'] ?? [],
            'payment_logos' => $settings['payment_logos'] ?? [],
            'contacts_services' => $settings['contacts_services'] ?? [],
            'contact' => $settings['contact'] ?? [],
        ]);
    }
}
