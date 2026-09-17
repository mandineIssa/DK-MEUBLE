<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Promotion;
use App\Services\PromotionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PromotionController extends Controller
{
    public function index(Request $request, PromotionService $service): JsonResponse
    {
        $service->refreshStatuses();

        $sort = $request->query('sort', 'discount');
        $category = $request->query('category');
        $featured = $request->boolean('featured');

        $query = Promotion::query()
            ->publicVisible()
            ->with(['product.images', 'product.category', 'category']);

        if ($category) {
            $query->where(function ($q) use ($category) {
                $q->whereHas('category', fn ($c) => $c->where('slug', $category))
                    ->orWhereHas('product.category', fn ($c) => $c->where('slug', $category));
            });
        }

        if ($featured) {
            $query->where('is_featured', true)->orderBy('featured_order');
        } else {
            match ($sort) {
                'price_asc' => $query->orderBy('price_promo'),
                'price_desc' => $query->orderByDesc('price_promo'),
                'ending' => $query->orderBy('end_date'),
                default => $query->orderByDesc('discount_percent'),
            };
        }

        $promotions = $query->paginate(min(48, max(1, (int) $request->query('per_page', 24))));

        $categories = Category::query()
            ->withCount([
                'products as active_promos_count' => function ($q) {
                    $q->whereHas('promotions', fn ($p) => $p->publicVisible());
                },
            ])
            ->orderBy('name')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'count' => (int) $c->active_promos_count,
            ])
            ->filter(fn ($c) => $c['count'] > 0)
            ->values();

        $settings = $service->settings();

        return response()->json([
            'data' => $promotions->items(),
            'meta' => [
                'total' => $promotions->total(),
                'current_page' => $promotions->currentPage(),
                'last_page' => $promotions->lastPage(),
                'per_page' => $promotions->perPage(),
            ],
            'categories' => $categories,
            'legal_text' => $settings['legal_text'] ?? '',
        ]);
    }

    public function show(int $id, PromotionService $service): JsonResponse
    {
        $service->refreshStatuses();

        $promo = Promotion::query()
            ->publicVisible()
            ->with(['product.images', 'product.category', 'category'])
            ->findOrFail($id);

        return response()->json($promo);
    }
}
