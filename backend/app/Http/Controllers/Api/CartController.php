<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function show(Request $request, CartService $carts): JsonResponse
    {
        $cart = $carts->resolve($request->header('X-Cart-Token'), $request->user()?->id);
        $summary = $carts->summary($cart);

        return response()->json($summary)->header('X-Cart-Token', $cart->token);
    }

    public function add(Request $request, CartService $carts): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:99'],
        ]);
        $cart = $carts->resolve($request->header('X-Cart-Token'), $request->user()?->id);
        $cart = $carts->addItem($cart, (int) $data['product_id'], (int) ($data['quantity'] ?? 1));

        return response()->json($carts->summary($cart))->header('X-Cart-Token', $cart->token);
    }

    public function update(Request $request, CartService $carts): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'quantity' => ['required', 'integer', 'min:0', 'max:99'],
        ]);
        $cart = $carts->resolve($request->header('X-Cart-Token'), $request->user()?->id);
        $cart = $carts->updateItem($cart, (int) $data['product_id'], (int) $data['quantity']);

        return response()->json($carts->summary($cart))->header('X-Cart-Token', $cart->token);
    }

    public function remove(Request $request, CartService $carts): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
        ]);
        $cart = $carts->resolve($request->header('X-Cart-Token'), $request->user()?->id);
        $cart = $carts->removeItem($cart, (int) $data['product_id']);

        return response()->json($carts->summary($cart))->header('X-Cart-Token', $cart->token);
    }
}
