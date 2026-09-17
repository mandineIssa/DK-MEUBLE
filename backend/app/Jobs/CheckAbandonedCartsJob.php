<?php

namespace App\Jobs;

use App\Models\Cart;
use App\Models\Customer;
use App\Services\NotificationService;
use App\Services\NotificationSettings;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class CheckAbandonedCartsJob implements ShouldQueue
{
    use Queueable;

    public function handle(NotificationService $notifications): void
    {
        $settings = NotificationSettings::get();
        if (! ($settings['types_enabled']['abandoned_cart'] ?? true)) {
            return;
        }

        $hours = max(1, (int) ($settings['abandoned_cart_hours'] ?? 24));
        $cutoff = now()->subHours($hours);

        Cart::query()
            ->whereNotNull('customer_id')
            ->where('updated_at', '<=', $cutoff)
            ->whereHas('items')
            ->with('customer')
            ->limit(200)
            ->get()
            ->each(function (Cart $cart) use ($notifications) {
                $customer = $cart->customer;
                if (! $customer instanceof Customer) {
                    return;
                }
                $notifications->notify(
                    'abandoned_cart',
                    [
                        'customer_name' => $customer->name ?: 'Client',
                        'link' => '/panier',
                    ],
                    $customer,
                    null,
                    '/panier',
                    null,
                    'abandoned_cart:'.$cart->id,
                );
            });
    }
}
