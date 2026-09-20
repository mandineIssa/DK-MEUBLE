<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\DeliveryZone;
use App\Models\Order;
use App\Models\OrderStatusLog;
use App\Models\Product;
use App\Models\Showroom;
use App\Services\Sms\SmsSender;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(
        private CartService $carts,
        private SmsSender $sms,
        private NotificationService $notifications,
        private OrderReceiptService $receipts,
    ) {}

    public function checkout(Cart $cart, array $data, ?int $customerId = null): Order
    {
        $settings = CheckoutSettings::get();
        if (empty($settings['guest_enabled']) && ! $customerId) {
            throw ValidationException::withMessages([
                'customer' => 'Connexion requise pour commander.',
            ]);
        }

        $summary = $this->carts->summary($cart);
        if ($summary['items_count'] < 1) {
            throw ValidationException::withMessages(['cart' => 'Panier vide.']);
        }

        $methods = collect($settings['payment_methods'] ?? [])->where('enabled', true)->pluck('key')->all();
        if (! in_array($data['payment_method'], $methods, true)) {
            throw ValidationException::withMessages(['payment_method' => 'Mode de paiement non disponible.']);
        }

        $deliveryFee = 0;
        $zoneId = null;
        $showroomId = null;

        if ($data['delivery_method'] === 'domicile') {
            $zone = DeliveryZone::query()->active()->findOrFail($data['delivery_zone_id']);
            $deliveryFee = (int) $zone->delivery_fee;
            $zoneId = $zone->id;
            if (empty($data['address'])) {
                throw ValidationException::withMessages(['address' => 'Adresse de livraison requise.']);
            }
        } else {
            $showroom = Showroom::query()->active()->findOrFail($data['showroom_id']);
            $showroomId = $showroom->id;
        }

        $subtotal = (int) $summary['subtotal'];
        $total = $subtotal + $deliveryFee;

        $order = DB::transaction(function () use ($cart, $data, $customerId, $summary, $deliveryFee, $zoneId, $showroomId, $subtotal, $total) {
            foreach ($summary['items'] as $line) {
                $product = Product::query()->lockForUpdate()->find($line['product_id']);
                if ($product && $product->stock_quantity !== null) {
                    if ($product->stock_quantity < $line['quantity']) {
                        throw ValidationException::withMessages([
                            'stock' => "Stock insuffisant pour {$product->name}.",
                        ]);
                    }
                    $product->decrement('stock_quantity', $line['quantity']);
                }
            }

            $order = Order::query()->create([
                'reference' => 'DK-'.strtoupper(Str::random(8)),
                'customer_id' => $customerId,
                'customer_name' => $data['customer_name'],
                'phone' => $data['phone'],
                'email' => $data['email'] ?? null,
                'address' => $data['address'] ?? null,
                'delivery_method' => $data['delivery_method'],
                'showroom_id' => $showroomId,
                'delivery_zone_id' => $zoneId,
                'delivery_fee' => $deliveryFee,
                'payment_method' => $data['payment_method'],
                'payment_status' => 'en_attente',
                'order_status' => 'en_attente',
                'subtotal' => $subtotal,
                'total' => $total,
                'customer_note' => $data['customer_note'] ?? null,
            ]);

            foreach ($summary['items'] as $line) {
                $order->items()->create([
                    'product_id' => $line['product_id'],
                    'product_name' => $line['name'],
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                    'subtotal' => $line['subtotal'],
                ]);
            }

            OrderStatusLog::query()->create([
                'order_id' => $order->id,
                'from_status' => null,
                'to_status' => 'en_attente',
                'note' => 'Commande créée',
            ]);

            $cart->items()->delete();

            return $order;
        });

        $settings = CheckoutSettings::get();
        if (! empty($settings['confirmation_enabled'])) {
            $msg = str_replace(
                ['{reference}', '{total}'],
                [$order->reference, number_format($order->total, 0, ',', ' ')],
                $settings['confirmation_sms'] ?? ''
            );
            try {
                $this->sms->send($order->phone, $msg);
            } catch (\Throwable $e) {
                // non-blocking
            }
        }

        $customer = $order->customer_id ? \App\Models\Customer::query()->find($order->customer_id) : null;
        if ($customer) {
            // Sync phone/email on customer record for channel delivery if missing on order flow
            if (! $customer->phone && $order->phone) {
                $customer->phone = $order->phone;
            }
            $this->notifications->notify(
                'order_placed',
                [
                    'customer_name' => $order->customer_name,
                    'order_number' => $order->reference,
                    'order_total' => number_format($order->total, 0, ',', ' '),
                    'link' => '/commande/confirmation?ref='.$order->reference,
                ],
                $customer,
                null,
                '/commande/confirmation?ref='.$order->reference,
            );
        }
        $this->notifications->notifyAdmins(
            'order_placed',
            [
                'customer_name' => $order->customer_name,
                'order_number' => $order->reference,
                'order_total' => number_format($order->total, 0, ',', ' '),
                'link' => '/admin/commandes',
            ],
            '/admin/commandes',
            ['in_app', 'email'],
        );

        return $order->load(['items', 'showroom', 'deliveryZone', 'statusLogs']);
    }

    public function updateStatus(Order $order, string $status, ?int $userId = null, ?string $note = null): Order
    {
        $allowed = ['en_attente', 'confirmee', 'en_preparation', 'expediee', 'livree', 'annulee'];
        if (! in_array($status, $allowed, true)) {
            throw ValidationException::withMessages(['order_status' => 'Statut invalide.']);
        }

        $from = $order->order_status;

        DB::transaction(function () use ($order, $status, $from, $userId, $note) {
            if ($status === 'annulee' && in_array($from, ['en_attente', 'confirmee', 'en_preparation'], true)) {
                foreach ($order->items as $item) {
                    if ($item->product_id) {
                        $product = Product::query()->lockForUpdate()->find($item->product_id);
                        if ($product && $product->stock_quantity !== null) {
                            $product->increment('stock_quantity', $item->quantity);
                        }
                    }
                }
            }

            $order->update(['order_status' => $status]);
            OrderStatusLog::query()->create([
                'order_id' => $order->id,
                'from_status' => $from,
                'to_status' => $status,
                'user_id' => $userId,
                'note' => $note,
            ]);
        });

        if ($status === 'confirmee') {
            try {
                $this->receipts->ensure($order->fresh(['items', 'deliveryZone', 'showroom']));
            } catch (\Throwable $e) {
                // non-blocking : le téléchargement pourra régénérer le reçu
            }
        }

        $templates = CheckoutSettings::get()['notification_templates'] ?? [];
        if (! empty($templates[$status])) {
            $msg = str_replace('{reference}', $order->reference, $templates[$status]);
            try {
                $this->sms->send($order->phone, $msg);
            } catch (\Throwable $e) {
            }
        }

        $customer = $order->customer_id ? \App\Models\Customer::query()->find($order->customer_id) : null;
        if ($customer) {
            $statusLabels = [
                'en_attente' => 'en attente',
                'confirmee' => 'confirmée',
                'en_preparation' => 'en préparation',
                'expediee' => 'expédiée',
                'livree' => 'livrée',
                'annulee' => 'annulée',
            ];
            $this->notifications->notify(
                'order_status',
                [
                    'customer_name' => $order->customer_name,
                    'order_number' => $order->reference,
                    'order_status' => $statusLabels[$status] ?? $status,
                    'link' => '/compte',
                ],
                $customer,
                null,
                '/compte',
            );
        }

        return $order->fresh()->load(['items', 'showroom', 'deliveryZone', 'statusLogs']);
    }
}
