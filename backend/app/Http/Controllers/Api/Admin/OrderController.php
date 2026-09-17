<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\CheckoutSettings;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = Order::query()
            ->with(['items', 'deliveryZone:id,zone_name,city', 'showroom:id,name'])
            ->when($request->query('status'), fn ($q, $s) => $q->where('order_status', $s))
            ->when($request->query('city'), function ($q, $city) {
                $q->where(function ($w) use ($city) {
                    $w->where('address', 'like', "%{$city}%")
                        ->orWhereHas('deliveryZone', fn ($z) => $z->where('city', 'like', "%{$city}%")->orWhere('zone_name', 'like', "%{$city}%"));
                });
            })
            ->when($request->query('payment'), fn ($q, $p) => $q->where('payment_method', $p))
            ->latest()
            ->paginate(min(100, max(1, (int) $request->query('per_page', 50))));

        // Compat : front admin attendait un tableau ; on expose data + conserve items à la racine via data.
        return response()->json($orders);
    }

    public function show(Order $order): JsonResponse
    {
        return response()->json($order->load(['items.product', 'statusLogs.user', 'deliveryZone', 'showroom', 'customer']));
    }

    public function updateStatus(Request $request, Order $order, OrderService $orders): JsonResponse
    {
        $data = $request->validate([
            'order_status' => ['required', 'string'],
            'payment_status' => ['nullable', 'in:en_attente,paye,echoue,rembourse'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);
        if (! empty($data['payment_status'])) {
            $order->update(['payment_status' => $data['payment_status']]);
        }
        $updated = $orders->updateStatus($order, $data['order_status'], $request->user()?->id, $data['note'] ?? null);

        return response()->json($updated);
    }

    public function export(): StreamedResponse
    {
        $filename = 'commandes-'.now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['reference', 'date', 'client', 'phone', 'status', 'payment', 'subtotal', 'delivery_fee', 'total']);
            Order::query()->latest()->chunk(100, function ($chunk) use ($out) {
                foreach ($chunk as $o) {
                    fputcsv($out, [
                        $o->reference,
                        $o->created_at,
                        $o->customer_name,
                        $o->phone,
                        $o->order_status,
                        $o->payment_method,
                        $o->subtotal,
                        $o->delivery_fee,
                        $o->total,
                    ]);
                }
            });
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    public function settings(): JsonResponse
    {
        return response()->json(CheckoutSettings::get());
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $data = $request->validate([
            'guest_enabled' => ['sometimes', 'boolean'],
            'stock_per_showroom' => ['sometimes', 'boolean'],
            'payment_methods' => ['sometimes', 'array'],
            'confirmation_enabled' => ['sometimes', 'boolean'],
            'confirmation_sms' => ['sometimes', 'nullable', 'string'],
            'notification_templates' => ['sometimes', 'array'],
        ]);

        return response()->json(CheckoutSettings::update($data));
    }
}
