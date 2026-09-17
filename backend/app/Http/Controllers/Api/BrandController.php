<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Product;
use App\Services\CategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $featured = $request->boolean('featured');
        $query = Brand::query()->active()->orderBy('display_order')->orderBy('name');
        if ($featured) {
            $query->featured();
        }
        $brands = $query->withCount(['products' => fn ($q) => $q->published()])->get();

        return response()->json($brands);
    }

    public function show(string $slug, Request $request, CategoryService $categories): JsonResponse
    {
        $brand = Brand::query()->active()->where('slug', $slug)->firstOrFail();
        $products = Product::query()
            ->published()
            ->where('brand_id', $brand->id)
            ->with(['category', 'images', 'brand', 'promotions'])
            ->when($request->query('category'), function ($q, $catSlug) use ($categories) {
                $cat = \App\Models\Category::query()->where('slug', $catSlug)->first();
                if ($cat) {
                    $q->whereIn('category_id', $categories->descendantIds($cat));
                }
            })
            ->latest()
            ->paginate(min(48, max(1, (int) $request->query('per_page', 24))));

        return response()->json([
            'brand' => $brand,
            'products' => $products->items(),
            'meta' => [
                'total' => $products->total(),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
            ],
        ]);
    }
}
