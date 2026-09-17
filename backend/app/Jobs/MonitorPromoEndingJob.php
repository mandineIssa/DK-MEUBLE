<?php

namespace App\Jobs;

use App\Models\Promotion;
use App\Models\Wishlist;
use App\Services\NotificationService;
use App\Services\NotificationSettings;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class MonitorPromoEndingJob implements ShouldQueue
{
    use Queueable;

    public function handle(NotificationService $notifications): void
    {
        $settings = NotificationSettings::get();
        if (! ($settings['types_enabled']['promo_ending'] ?? true)) {
            return;
        }

        $hours = max(1, (int) ($settings['promo_ending_hours'] ?? 24));
        $until = now()->addHours($hours);

        $promos = Promotion::query()
            ->publicVisible()
            ->where('end_date', '>', now())
            ->where('end_date', '<=', $until)
            ->with('product')
            ->get();

        foreach ($promos as $promo) {
            $product = $promo->product;
            if (! $product) {
                continue;
            }

            Wishlist::query()
                ->where('product_id', $product->id)
                ->with('customer')
                ->chunkById(100, function ($rows) use ($notifications, $product) {
                    foreach ($rows as $item) {
                        if (! $item->customer) {
                            continue;
                        }
                        $notifications->notify(
                            'promo_ending',
                            [
                                'customer_name' => $item->customer->name ?: '',
                                'product_name' => $product->name,
                                'link' => '/produits/'.$product->slug,
                            ],
                            $item->customer,
                            null,
                            '/produits/'.$product->slug,
                            null,
                            'promo_ending:'.$product->id.':'.$item->customer_id,
                        );
                    }
                });
        }
    }
}
