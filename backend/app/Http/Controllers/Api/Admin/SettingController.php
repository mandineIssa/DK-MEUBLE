<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\SiteContentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(SiteContentService $content): JsonResponse
    {
        return response()->json($content->allSettings());
    }

    public function update(Request $request, SiteContentService $content): JsonResponse
    {
        $data = $request->validate([
            'brand' => ['sometimes', 'array'],
            'brand.name' => ['sometimes', 'nullable', 'string', 'max:120'],
            'brand.logo_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'contact' => ['sometimes', 'array'],
            'product_page' => ['sometimes', 'array'],
            'product_page.show_delivery' => ['sometimes', 'boolean'],
            'product_page.delivery_title' => ['sometimes', 'nullable', 'string', 'max:120'],
            'product_page.delivery_line_1' => ['sometimes', 'nullable', 'string', 'max:180'],
            'product_page.delivery_line_2' => ['sometimes', 'nullable', 'string', 'max:180'],
            'product_page.delivery_link_label' => ['sometimes', 'nullable', 'string', 'max:80'],
            'product_page.delivery_is_example' => ['sometimes', 'boolean'],
            'product_page.show_installation' => ['sometimes', 'boolean'],
            'product_page.installation_title' => ['sometimes', 'nullable', 'string', 'max:120'],
            'product_page.installation_text' => ['sometimes', 'nullable', 'string', 'max:300'],
            'product_page.installation_link_label' => ['sometimes', 'nullable', 'string', 'max:80'],
            'product_page.show_installment' => ['sometimes', 'boolean'],
            'product_page.installment_title' => ['sometimes', 'nullable', 'string', 'max:120'],
            'product_page.installment_text' => ['sometimes', 'nullable', 'string', 'max:180'],
            'product_page.installment_link_label' => ['sometimes', 'nullable', 'string', 'max:80'],
            'product_page.installment_is_example' => ['sometimes', 'boolean'],
            'product_page.show_share' => ['sometimes', 'boolean'],
            'product_page.share_title' => ['sometimes', 'nullable', 'string', 'max:80'],
            'product_page.example_discount' => ['sometimes', 'nullable', 'string', 'max:40'],
            'product_page.example_stock' => ['sometimes', 'nullable', 'string', 'max:40'],
            'product_page.example_specs' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'product_page.reviews' => ['sometimes', 'array', 'max:6'],
            'product_page.reviews.*.name' => ['sometimes', 'nullable', 'string', 'max:80'],
            'product_page.reviews.*.city' => ['sometimes', 'nullable', 'string', 'max:80'],
            'product_page.reviews.*.rating' => ['sometimes', 'integer', 'min:1', 'max:5'],
            'product_page.reviews.*.body' => ['sometimes', 'nullable', 'string', 'max:500'],
            'topbar' => ['sometimes', 'array'],
            'topbar.enabled' => ['sometimes', 'boolean'],
            'topbar.text_1' => ['sometimes', 'nullable', 'string', 'max:160'],
            'topbar.text_2' => ['sometimes', 'nullable', 'string', 'max:160'],
            'topbar.phone_label' => ['sometimes', 'nullable', 'string', 'max:80'],
            'topbar.show_phone' => ['sometimes', 'boolean'],
            'topbar.phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'socials' => ['sometimes', 'array'],
            'footer' => ['sometimes', 'array'],
            'seo' => ['sometimes', 'array'],
            'legal' => ['sometimes', 'array'],
            'contacts_services' => ['sometimes', 'array'],
            'payment_logos' => ['sometimes', 'array'],
            'homepage' => ['sometimes', 'array'],
            'theme' => ['sometimes', 'array'],
            'theme.header_bg' => ['sometimes', 'nullable', 'string', 'max:40'],
            'theme.body_bg' => ['sometimes', 'nullable', 'string', 'max:40'],
            'theme.content_bg_alt' => ['sometimes', 'nullable', 'string', 'max:40'],
            'theme.text_primary' => ['sometimes', 'nullable', 'string', 'max:40'],
            'theme.text_secondary' => ['sometimes', 'nullable', 'string', 'max:40'],
            'theme.border_light' => ['sometimes', 'nullable', 'string', 'max:40'],
            'theme.accent_primary' => ['sometimes', 'nullable', 'string', 'max:40'],
            'theme.accent_primary_hover' => ['sometimes', 'nullable', 'string', 'max:40'],
            'theme.price_color' => ['sometimes', 'nullable', 'string', 'max:40'],
            'theme.price_strikethrough' => ['sometimes', 'nullable', 'string', 'max:40'],
            'theme.success_color' => ['sometimes', 'nullable', 'string', 'max:40'],
            'theme.danger_color' => ['sometimes', 'nullable', 'string', 'max:40'],
            'theme.badge_bg' => ['sometimes', 'nullable', 'string', 'max:40'],
            'theme.use_alt_bg_sections' => ['sometimes', 'boolean'],
            'theme.header_compact_scroll' => ['sometimes', 'integer', 'min:0', 'max:500'],
            'theme.header_nav_bg' => ['sometimes', 'nullable', 'string', 'max:40'],
        ]);

        return response()->json($content->updateSettings($data));
    }

    public function uploadLogo(Request $request, SiteContentService $content): JsonResponse
    {
        $request->validate([
            'logo' => ['required', 'image', 'max:2048'],
        ]);

        $path = $request->file('logo')->store('brand', 'public');
        $settings = $content->allSettings();
        $brand = is_array($settings['brand'] ?? null) ? $settings['brand'] : [];
        $brand['logo_url'] = $path;
        if (empty($brand['name'])) {
            $brand['name'] = 'DK HOMETECH';
        }

        return response()->json($content->updateSettings(['brand' => $brand]));
    }
}
