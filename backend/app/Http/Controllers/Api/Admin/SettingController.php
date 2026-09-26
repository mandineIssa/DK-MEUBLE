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
