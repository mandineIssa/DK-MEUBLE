<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HomepageSection;
use App\Models\NewsletterSubscriber;
use App\Services\HomepageService;
use App\Support\PublicCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HomepageController extends Controller
{
    public function show(HomepageService $homepage): JsonResponse
    {
        return PublicCache::json($homepage->assemble(), 60, 300);
    }

    public function sectionProducts(int $id, HomepageService $homepage): JsonResponse
    {
        $section = HomepageSection::query()->findOrFail($id);

        return PublicCache::json([
            'section_id' => $section->id,
            'products' => $homepage->productsForSection($section),
        ], 30, 120);
    }

    public function subscribeNewsletter(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:190'],
        ]);

        NewsletterSubscriber::query()->updateOrCreate(
            ['email' => strtolower(trim($data['email']))],
            ['source' => 'homepage', 'subscribed_at' => now()]
        );

        return response()->json(['message' => 'Inscription enregistrée. Merci !']);
    }
}
