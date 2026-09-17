<?php

use App\Jobs\CheckAbandonedCartsJob;
use App\Jobs\MonitorPromoEndingJob;
use App\Jobs\MonitorWishlistAlertsJob;
use App\Services\NotificationService;
use App\Services\PromotionService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('promotions:refresh-status', function (PromotionService $service) {
    $result = $service->refreshStatuses();
    $this->info("Expired: {$result['expired']}, Out of stock: {$result['out_of_stock']}");
})->purpose('Expire les promotions et gère les ruptures de stock');

Artisan::command('notifications:seed-templates', function (NotificationService $service) {
    $n = $service->seedTemplates();
    $this->info("Templates seeded: {$n}");
})->purpose('Seed les templates de notification');

Artisan::command('notifications:monitor-wishlist', function () {
    MonitorWishlistAlertsJob::dispatchSync();
    $this->info('Wishlist alerts checked.');
})->purpose('Surveille prix/stock des favoris');

Artisan::command('notifications:abandoned-carts', function () {
    CheckAbandonedCartsJob::dispatchSync();
    $this->info('Abandoned carts checked.');
})->purpose('Relance paniers abandonnés');

Artisan::command('notifications:promo-ending', function () {
    MonitorPromoEndingJob::dispatchSync();
    $this->info('Promo ending alerts checked.');
})->purpose('Alerte fin de promo sur favoris');

Schedule::command('promotions:refresh-status')->hourly();
Schedule::job(new MonitorWishlistAlertsJob)->hourly();
Schedule::job(new CheckAbandonedCartsJob)->hourly();
Schedule::job(new MonitorPromoEndingJob)->hourly();
