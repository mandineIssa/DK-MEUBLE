<?php

namespace App\Jobs;

use App\Models\Wishlist;
use App\Services\NotificationService;
use App\Services\NotificationSettings;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class MonitorWishlistAlertsJob implements ShouldQueue
{
    use Queueable;

    public function handle(NotificationService $notifications): void
    {
        $settings = NotificationSettings::get();
        if (! ($settings['types_enabled']['price_drop'] ?? true)
            && ! ($settings['types_enabled']['back_in_stock'] ?? true)
            && ! ($settings['types_enabled']['favorite_removed'] ?? true)) {
            return;
        }

        $threshold = max(1, (float) ($settings['price_drop_threshold_percent'] ?? 5));

        Wishlist::query()
            ->with(['customer', 'product.promotions'])
            ->chunkById(100, function ($rows) use ($notifications, $threshold, $settings) {
                foreach ($rows as $item) {
                    /** @var Wishlist $item */
                    $product = $item->product;
                    $customer = $item->customer;
                    if (! $product || ! $customer) {
                        continue;
                    }

                    $current = $product->effective_price;
                    $saved = $item->price_at_save;
                    $link = '/produits/'.$product->slug;

                    if (($settings['types_enabled']['price_drop'] ?? true)
                        && $saved
                        && $current !== null
                        && $current < $saved) {
                        $dropPct = (($saved - $current) / max(1, $saved)) * 100;
                        if ($dropPct >= $threshold) {
                            $recent = $item->last_notified_at && $item->last_notified_at->gt(now()->subDay());
                            if (! $recent) {
                                $notifications->notify(
                                    'price_drop',
                                    [
                                        'customer_name' => $customer->name ?: 'Client',
                                        'product_name' => $product->name,
                                        'old_price' => number_format($saved, 0, ',', ' '),
                                        'new_price' => number_format($current, 0, ',', ' '),
                                        'link' => $link,
                                    ],
                                    $customer,
                                    null,
                                    $link,
                                    null,
                                    'price_drop:'.$product->id,
                                );
                                $item->update([
                                    'last_notified_at' => now(),
                                    'price_at_save' => $current,
                                ]);
                            }
                        }
                    }

                    $stock = $product->stock_quantity;
                    if (($settings['types_enabled']['favorite_removed'] ?? true)
                        && ($product->status !== 'published' || ($stock !== null && $stock <= 0 && $product->status === 'archived'))) {
                        $notifications->notify(
                            'favorite_removed',
                            [
                                'customer_name' => $customer->name ?: 'Client',
                                'product_name' => $product->name,
                                'link' => $link,
                            ],
                            $customer,
                            null,
                            $link,
                            ['in_app'],
                            'removed:'.$product->id,
                        );
                    }
                }
            });

        Wishlist::query()
            ->with(['customer', 'product'])
            ->whereNotNull('last_stock_notified_at')
            ->chunkById(100, function ($rows) use ($notifications, $settings) {
                if (! ($settings['types_enabled']['back_in_stock'] ?? true)) {
                    return;
                }
                foreach ($rows as $item) {
                    $product = $item->product;
                    $customer = $item->customer;
                    if (! $product || ! $customer) {
                        continue;
                    }
                    if ($product->stock_quantity !== null && $product->stock_quantity > 0) {
                        $link = '/produits/'.$product->slug;
                        $notifications->notify(
                            'back_in_stock',
                            [
                                'customer_name' => $customer->name ?: 'Client',
                                'product_name' => $product->name,
                                'link' => $link,
                            ],
                            $customer,
                            null,
                            $link,
                            null,
                            'stock:'.$product->id,
                        );
                        $item->update(['last_stock_notified_at' => null]);
                    }
                }
            });

        Wishlist::query()
            ->whereHas('product', fn ($q) => $q->whereNotNull('stock_quantity')->where('stock_quantity', '<=', 0))
            ->whereNull('last_stock_notified_at')
            ->update(['last_stock_notified_at' => now()]);
    }
}
