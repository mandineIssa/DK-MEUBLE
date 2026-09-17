<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\CategoryService;
use App\Services\PlpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(CategoryService $service): JsonResponse
    {
        return response()->json([
            'tree' => $service->tree(true),
            'popular' => $service->popular(),
            'settings' => [
                'show_breadcrumb' => (bool) $service->settings()['show_breadcrumb'],
                'default_sort' => $service->settings()['default_sort'],
                'hide_empty' => (bool) $service->settings()['hide_empty'],
            ],
        ]);
    }

    public function show(string $slug, Request $request, CategoryService $service, PlpService $plp): JsonResponse
    {
        $category = $service->resolveSlug($slug);
        if (! $category) {
            $redirect = $service->redirectFor($slug);
            if ($redirect) {
                return response()->json([
                    'redirect_to' => $redirect,
                ]);
            }
            abort(404);
        }

        if (! $category->is_active) {
            abort(404);
        }

        $catSettings = $service->settings();
        $params = $request->query();
        // Pré-sélection : si aucun category[] n'est passé, on reste dans le scope de la page (descendants)
        $listing = $plp->listing($category, $params, $service);
        $counts = $service->productsCountMap();

        $children = Category::query()
            ->where('parent_id', $category->id)
            ->where('is_active', true)
            ->orderBy('display_order')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'products_count' => (int) ($counts[$c->id] ?? 0),
            ])
            ->when(! empty($catSettings['hide_empty']), fn ($col) => $col->filter(fn ($c) => $c['products_count'] > 0))
            ->values();

        $attributes = $category->attributes()
            ->with('options')
            ->where('is_filterable', true)
            ->get();

        return response()->json([
            'category' => [
                'id' => $category->id,
                'parent_id' => $category->parent_id,
                'name' => $category->name,
                'slug' => $category->slug,
                'icon' => $category->icon,
                'image_path' => $category->image_path,
                'description' => $category->description,
                'meta_title' => $category->meta_title,
                'meta_description' => $category->meta_description,
                'products_count' => (int) ($counts[$category->id] ?? 0),
                'breadcrumb' => $catSettings['show_breadcrumb'] ? $category->breadcrumb() : [],
            ],
            'children' => $children,
            'attributes' => $attributes,
            'products' => $listing['products'],
            'meta' => $listing['meta'],
            'facets' => $listing['facets'],
            'price_bounds' => $listing['price_bounds'],
            'settings' => array_merge([
                'show_breadcrumb' => (bool) $catSettings['show_breadcrumb'],
                'default_sort' => $catSettings['default_sort'],
            ], $listing['settings']),
        ]);
    }

    public function filters(string $slug, Request $request, CategoryService $service, PlpService $plp): JsonResponse
    {
        $category = $service->resolveSlug($slug);
        if (! $category || ! $category->is_active) {
            abort(404);
        }

        $listing = $plp->listing($category, $request->query(), $service);

        return response()->json([
            'facets' => $listing['facets'],
            'price_bounds' => $listing['price_bounds'],
            'meta' => $listing['meta'],
            'settings' => $listing['settings'],
        ]);
    }

    public function attributes(string $slug): JsonResponse
    {
        $category = Category::query()->where('slug', $slug)->where('is_active', true)->firstOrFail();

        return response()->json(
            $category->attributes()->with('options')->where('is_filterable', true)->get()
        );
    }
}
