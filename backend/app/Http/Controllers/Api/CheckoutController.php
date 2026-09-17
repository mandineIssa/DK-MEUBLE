<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeliveryZone;
use App\Services\CartService;
use App\Services\CheckoutSettings;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckoutController extends Controller
{
    public function zones(): JsonResponse
    {
        return response()->json(
            DeliveryZone::query()->active()->orderBy('display_order')->orderBy('zone_name')->get()
        );
    }

    public function options(): JsonResponse
    {
        $settings = CheckoutSettings::get();

        return response()->json([
            'guest_enabled' => $settings['guest_enabled'],
            'payment_methods' => collect($settings['payment_methods'])->where('enabled', true)->values(),
            'stock_per_showroom' => $settings['stock_per_showroom'],
        ]);
    }

    public function store(Request $request, CartService $carts, OrderService $orders): JsonResponse
    {
        $data = $request->validate([
            'customer_name' => ['required', 'string', 'max:150'],
            'phone' => ['required', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:150'],
            'address' => ['nullable', 'string', 'max:500'],
            'delivery_method' => ['required', 'in:domicile,retrait_showroom'],
            'delivery_zone_id' => ['nullable', 'exists:delivery_zones,id'],
            'showroom_id' => ['nullable', 'exists:showrooms,id'],
            'payment_method' => ['required', 'string', 'max:40'],
            'customer_note' => ['nullable', 'string', 'max:2000'],
        ]);

        $cart = $carts->resolve($request->header('X-Cart-Token'), $request->user()?->id);
        $order = $orders->checkout($cart, $data, $request->user()?->id);

        return response()->json($order, 201)->header('X-Cart-Token', $cart->token);
    }
}
