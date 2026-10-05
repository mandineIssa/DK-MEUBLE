<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $status = (string) $request->query('status', 'all');
        if (! in_array($status, ['all', 'active', 'waiting'], true)) {
            $status = 'all';
        }
        $perPage = min(50, max(1, (int) $request->query('per_page', 12)));
        $cutoff = now()->subDay();

        $summaryCarts = Cart::query()
            ->whereHas('items')
            ->with(['items.product.promotions'])
            ->get();

        $summary = [
            'carts' => $summaryCarts->count(),
            'active' => $summaryCarts->filter(fn (Cart $cart) => $cart->updated_at >= $cutoff)->count(),
            'waiting' => $summaryCarts->filter(fn (Cart $cart) => $cart->updated_at < $cutoff)->count(),
            'items' => (int) $summaryCarts->sum(fn (Cart $cart) => $cart->items->sum('quantity')),
            'value' => (int) $summaryCarts->sum(fn (Cart $cart) => $this->subtotal($cart)),
        ];

        $query = Cart::query()
            ->whereHas('items')
            ->with([
                'customer:id,name,phone,email',
                'items.product.promotions',
                'items.product.images' => fn ($q) => $q->orderBy('order')->limit(1),
            ])
            ->when($status === 'active', fn ($q) => $q->where('updated_at', '>=', $cutoff))
            ->when($status === 'waiting', fn ($q) => $q->where('updated_at', '<', $cutoff))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($inner) use ($search) {
                    $inner->whereHas('customer', function ($c) use ($search) {
                        $c->where('phone', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%");
                    })->orWhereHas('items', function ($item) use ($search) {
                        $item->whereHas('product', function ($p) use ($search) {
                            $p->where('name', 'like', "%{$search}%")
                                ->orWhere('slug', 'like', "%{$search}%");
                        });
                    });
                    if (in_array(mb_strtolower($search), ['visiteur', 'invite', 'invité'], true)) {
                        $inner->orWhereNull('customer_id');
                    }
                });
            })
            ->orderByDesc('updated_at');

        $page = $query->paginate($perPage);

        return response()->json([
            'data' => $page->getCollection()->map(fn (Cart $cart) => $this->payload($cart, $cutoff))->values(),
            'current_page' => $page->currentPage(),
            'last_page' => $page->lastPage(),
            'per_page' => $page->perPage(),
            'total' => $page->total(),
            'summary' => $summary,
        ]);
    }

    private function payload(Cart $cart, \Illuminate\Support\Carbon $cutoff): array
    {
        $lines = [];
        foreach ($cart->items as $item) {
            $lines[] = $this->line($item);
        }

        $customer = $cart->customer;

        return [
            'id' => $cart->id,
            'status' => $cart->updated_at >= $cutoff ? 'active' : 'waiting',
            'updated_at' => $cart->updated_at?->toIso8601String(),
            'created_at' => $cart->created_at?->toIso8601String(),
            'items_count' => count($lines),
            'quantity' => (int) array_sum(array_column($lines, 'quantity')),
            'subtotal' => (int) array_sum(array_column($lines, 'line_total')),
            'customer' => $customer ? [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'email' => $customer->email,
            ] : null,
            'items' => $lines,
        ];
    }

    private function line(CartItem $item): array
    {
        $product = $item->product;
        $unit = $product ? (int) ($product->effective_price ?? 0) : 0;

        return [
            'product_id' => $item->product_id,
            'name' => $product?->name ?: 'Produit retiré du catalogue',
            'slug' => $product?->slug,
            'quantity' => (int) $item->quantity,
            'unit_price' => $unit,
            'line_total' => $unit * (int) $item->quantity,
            'image' => $product?->images->first()?->path,
            'available' => (bool) $product,
        ];
    }

    private function subtotal(Cart $cart): int
    {
        return (int) $cart->items->sum(function (CartItem $item) {
            $unit = $item->product ? (int) ($item->product->effective_price ?? 0) : 0;

            return $unit * (int) $item->quantity;
        });
    }
}
