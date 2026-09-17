<?php

namespace App\Services;

use App\Models\Setting;

class NotificationSettings
{
    public static function defaults(): array
    {
        return [
            'price_drop_threshold_percent' => 5,
            'digest_minutes' => 60,
            'abandoned_cart_hours' => 24,
            'newsletter_frequency' => 'weekly',
            'channel_fallback' => ['whatsapp', 'sms', 'email'],
            'providers' => [
                'email' => 'smtp',
                'sms' => env('SMS_DRIVER', 'log'),
                'whatsapp' => 'log',
                'push' => 'log',
                'push_vapid_public' => env('VAPID_PUBLIC_KEY'),
            ],
            'push_enabled' => true,
            'promo_ending_hours' => 24,
            'report_rate_limit_per_hour' => 5,
            'chat_rate_limit_per_hour' => 30,
            'chat_whatsapp_number' => '',
            'chat_forward_to_whatsapp' => true,
            'chat_auto_reply_enabled' => true,
            'chat_greeting_reply' => 'Bonjour {{customer_name}} ! Merci pour votre intérêt pour {{product_name}}. Comment pouvons-nous vous aider ?',
            'chat_price_reply' => '{{product_name}} est à {{product_price}}. Souhaitez-vous plus d’infos ou un devis ?',
            'types_enabled' => [
                'order_placed' => true,
                'order_status' => true,
                'chat_message' => true,
                'chat_reply' => true,
                'price_drop' => true,
                'back_in_stock' => true,
                'favorite_removed' => true,
                'service_request' => true,
                'content_report' => true,
                'newsletter' => true,
                'category_promo' => true,
                'abandoned_cart' => true,
                'promo_ending' => true,
            ],
            'critical_types' => ['order_placed', 'order_status'],
        ];
    }

    public static function get(): array
    {
        $stored = Setting::query()->where('key', 'notifications')->value('value');
        $value = is_array($stored) ? $stored : [];

        return array_replace_recursive(self::defaults(), $value);
    }

    public static function update(array $payload): array
    {
        $merged = array_replace_recursive(self::get(), $payload);
        Setting::query()->updateOrCreate(['key' => 'notifications'], ['value' => $merged]);

        return self::get();
    }

    /** @return list<string> */
    public static function types(): array
    {
        return array_keys(self::defaults()['types_enabled']);
    }
}
