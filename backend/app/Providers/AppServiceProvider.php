<?php

namespace App\Providers;

use App\Services\Sms\LogSmsSender;
use App\Services\Sms\SmsSender;
use App\Services\Sms\TwilioSmsSender;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(SmsSender::class, function () {
            return match (config('services.sms.driver', 'log')) {
                'twilio' => new TwilioSmsSender(),
                default => new LogSmsSender(),
            };
        });
    }

    public function boot(): void
    {
        //
    }
}
