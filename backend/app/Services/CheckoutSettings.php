<?php

namespace App\Services;

use App\Models\Setting;

class CheckoutSettings
{
    public static function defaults(): array
    {
        return [
            'guest_enabled' => true,
            'stock_per_showroom' => false,
            'payment_methods' => [
                ['key' => 'cash', 'label' => 'Paiement à la livraison', 'enabled' => true],
                ['key' => 'wave', 'label' => 'Wave', 'enabled' => true],
                ['key' => 'orange_money', 'label' => 'Orange Money', 'enabled' => true],
                ['key' => 'carte', 'label' => 'Carte bancaire', 'enabled' => false],
                ['key' => 'virement', 'label' => 'Virement', 'enabled' => true],
            ],
            'confirmation_enabled' => true,
            'confirmation_sms' => 'DK HOMETECH : commande {reference} reçue. Total {total} FCFA. Merci !',
            'notification_templates' => [
                'confirmee' => 'Votre commande {reference} est confirmée.',
                'en_preparation' => 'Commande {reference} en préparation.',
                'expediee' => 'Commande {reference} expédiée / prête au retrait.',
                'livree' => 'Commande {reference} livrée. Merci !',
                'annulee' => 'Commande {reference} annulée.',
            ],
        ];
    }

    public static function get(): array
    {
        $stored = Setting::query()->where('key', 'checkout')->value('value');
        $value = is_array($stored) ? $stored : [];

        return array_replace_recursive(self::defaults(), $value);
    }

    public static function update(array $payload): array
    {
        $merged = array_replace_recursive(self::get(), $payload);
        Setting::query()->updateOrCreate(['key' => 'checkout'], ['value' => $merged]);

        return self::get();
    }
}
