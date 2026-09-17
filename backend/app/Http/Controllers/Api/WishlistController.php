<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Wishlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = Wishlist::query()
            ->where('customer_id', $request->user()->id)
            ->with(['product.images', 'product.brand', 'product.promotions', 'product.category'])
            ->latest()
            ->get()
            ->pluck('product')
            ->filter()
            ->values();

        return response()->json($items);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
        ]);
        $product = Product::query()->published()->findOrFail($data['product_id']);

        $item = Wishlist::query()->firstOrCreate(
            [
                'customer_id' => $request->user()->id,
                'product_id' => $product->id,
            ],
            [
                'price_at_save' => $product->effective_price,
            ]
        );

        if ($item->wasRecentlyCreated === false && $item->price_at_save === null) {
            $item->update(['price_at_save' => $product->effective_price]);
        }

        return response()->json([
            'message' => 'Ajouté aux favoris. Vous serez alerté en cas de baisse de prix.',
            'price_at_save' => $item->fresh()->price_at_save,
        ], 201);
    }

    public function destroy(Request $request, int $productId): JsonResponse
    {
        Wishlist::query()
            ->where('customer_id', $request->user()->id)
            ->where('product_id', $productId)
            ->delete();

        return response()->json(['message' => 'Retiré des favoris.']);
    }
}
