<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function show(Request $request, string $reference): JsonResponse
    {
        $phone = preg_replace('/\D+/', '', (string) $request->query('phone', '')) ?: '';
        $order = Order::query()
            ->with(['items', 'showroom', 'deliveryZone', 'statusLogs'])
            ->where('reference', $reference)
            ->firstOrFail();

        if ($request->user()?->tokenCan('customer') || $request->user()?->getTable() === 'customers') {
            if ($order->customer_id && $order->customer_id !== $request->user()->id) {
                // allow if phone matches
            }
        }

        if ($phone !== '') {
            $orderPhone = preg_replace('/\D+/', '', $order->phone);
            if (! str_ends_with($orderPhone, substr($phone, -9))) {
                abort(404);
            }
        }

        return response()->json($order);
    }

    public function customerIndex(Request $request): JsonResponse
    {
        $orders = Order::query()
            ->with('items')
            ->where('customer_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json($orders);
    }

    public function cancel(Request $request, int $id, OrderService $orders): JsonResponse
    {
        $order = Order::query()
            ->where('customer_id', $request->user()->id)
            ->findOrFail($id);

        if (! in_array($order->order_status, ['en_attente', 'confirmee'], true)) {
            return response()->json(['message' => 'Cette commande ne peut plus être annulée.'], 422);
        }

        return response()->json($orders->updateStatus($order, 'annulee', null, 'Annulée par le client'));
    }
}
