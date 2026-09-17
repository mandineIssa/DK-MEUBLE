<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Wishlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishlistAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('search', ''));

        $items = Wishlist::query()
            ->with([
                'customer:id,name,phone,email',
                'product:id,name,slug,price,promo_price,status',
                'product.images' => fn ($q) => $q->orderBy('order')->limit(1),
            ])
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($inner) use ($q) {
                    $inner->whereHas('customer', function ($c) use ($q) {
                        $c->where('phone', 'like', "%{$q}%")
                            ->orWhere('email', 'like', "%{$q}%")
                            ->orWhere('name', 'like', "%{$q}%");
                    })->orWhereHas('product', function ($p) use ($q) {
                        $p->where('name', 'like', "%{$q}%")
                            ->orWhere('slug', 'like', "%{$q}%");
                    });
                });
            })
            ->latest()
            ->paginate(min(100, max(1, (int) $request->query('per_page', 50))));

        return response()->json($items);
    }
}
