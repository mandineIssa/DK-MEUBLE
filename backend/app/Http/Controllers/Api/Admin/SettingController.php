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
            $brand['name'] = 'DK MEUBLE';
        }

        return response()->json($content->updateSettings(['brand' => $brand]));
    }
}
