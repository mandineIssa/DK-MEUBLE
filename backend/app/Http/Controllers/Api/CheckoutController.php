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
            'delivery_zone_id' => ['nullable', 'required_if:delivery_method,domicile', 'exists:delivery_zones,id'],
            'showroom_id' => ['nullable', 'required_if:delivery_method,retrait_showroom', 'exists:showrooms,id'],
            'payment_method' => ['required', 'string', 'max:40'],
            'customer_note' => ['nullable', 'string', 'max:2000'],
        ], [
            'customer_name.required' => 'Indiquez votre nom.',
            'phone.required' => 'Indiquez votre numéro de téléphone.',
            'email.email' => 'Cet e-mail n’est pas valide.',
            'delivery_zone_id.required_if' => 'Choisissez votre zone de livraison.',
            'delivery_zone_id.exists' => 'Cette zone de livraison n’est plus disponible. Choisissez-en une autre.',
            'showroom_id.required_if' => 'Choisissez le magasin de retrait.',
            'showroom_id.exists' => 'Ce magasin n’est plus disponible. Choisissez-en un autre.',
            'payment_method.required' => 'Choisissez un mode de paiement.',
        ]);

        $cart = $carts->resolve($request->header('X-Cart-Token'), $request->user()?->id);
        $order = $orders->checkout($cart, $data, $request->user()?->id);

        return response()->json($order, 201)->header('X-Cart-Token', $cart->token);
    }
}
