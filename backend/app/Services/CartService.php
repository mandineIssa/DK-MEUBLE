<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\Product;
use Illuminate\Support\Str;

class CartService
{
    public function resolve(?string $token, ?int $customerId = null): Cart
    {
        $cart = null;
        if ($token) {
            $cart = Cart::query()->where('token', $token)->first();
        }
        if (! $cart && $customerId) {
            $cart = Cart::query()->where('customer_id', $customerId)->latest()->first();
        }
        if (! $cart) {
            $cart = Cart::query()->create([
                'token' => Str::uuid()->toString(),
                'customer_id' => $customerId,
            ]);
        } elseif ($customerId && ! $cart->customer_id) {
            $cart->update(['customer_id' => $customerId]);
            $this->mergeCustomerCarts($cart, $customerId);
        }

        return $cart->load(['items.product.images', 'items.product.brand', 'items.product.promotions']);
    }

    public function mergeCustomerCarts(Cart $primary, int $customerId): void
    {
        $others = Cart::query()
            ->where('customer_id', $customerId)
            ->where('id', '!=', $primary->id)
            ->with('items')
            ->get();

        foreach ($others as $other) {
            foreach ($other->items as $item) {
                $existing = $primary->items()->where('product_id', $item->product_id)->first();
                if ($existing) {
                    $existing->update(['quantity' => $existing->quantity + $item->quantity]);
                } else {
                    $primary->items()->create([
                        'product_id' => $item->product_id,
                        'quantity' => $item->quantity,
                    ]);
                }
            }
            $other->delete();
        }
    }

    public function addItem(Cart $cart, int $productId, int $qty = 1): Cart
    {
        $product = Product::query()->published()->findOrFail($productId);
        if ($product->effective_price === null) {
            abort(422, 'Ce produit est sur devis et ne peut pas être ajouté au panier.');
        }
        $item = $cart->items()->where('product_id', $productId)->first();
        if ($item) {
            $item->update(['quantity' => $item->quantity + max(1, $qty)]);
        } else {
            $cart->items()->create([
                'product_id' => $productId,
                'quantity' => max(1, $qty),
            ]);
        }

        return $cart->fresh()->load(['items.product.images', 'items.product.brand', 'items.product.promotions']);
    }

    public function updateItem(Cart $cart, int $productId, int $qty): Cart
    {
        $item = $cart->items()->where('product_id', $productId)->firstOrFail();
        if ($qty <= 0) {
            $item->delete();
        } else {
            $item->update(['quantity' => $qty]);
        }

        return $cart->fresh()->load(['items.product.images', 'items.product.brand', 'items.product.promotions']);
    }

    public function removeItem(Cart $cart, int $productId): Cart
    {
        $cart->items()->where('product_id', $productId)->delete();

        return $cart->fresh()->load(['items.product.images', 'items.product.brand', 'items.product.promotions']);
    }

    public function summary(Cart $cart): array
    {
        $lines = [];
        $subtotal = 0;
        foreach ($cart->items as $item) {
            $product = $item->product;
            if (! $product) {
                continue;
            }
            $unit = $product->effective_price ?? 0;
            $line = $unit * $item->quantity;
            $subtotal += $line;
            $lines[] = [
                'product_id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'quantity' => $item->quantity,
                'unit_price' => $unit,
                'compare_at_price' => $product->compare_at_price,
                'badge_label' => $product->badge_label,
                'subtotal' => $line,
                'image' => $product->images->first()?->path,
            ];
        }

        return [
            'token' => $cart->token,
            'items' => $lines,
            'items_count' => collect($lines)->sum('quantity'),
            'subtotal' => $subtotal,
        ];
    }
}
