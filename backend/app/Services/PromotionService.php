<?php

namespace App\Services;

use App\Models\Promotion;
use App\Models\PromotionAudit;
use App\Models\Setting;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class PromotionService
{
    public static function defaultSettings(): array
    {
        return [
            'min_discount_percent' => 1,
            'max_discount_percent' => 90,
            'min_duration_days' => 1,
            'max_duration_days' => 60,
            'max_active' => 100,
            'require_approval' => false,
            'legal_text' => 'Ces offres sont proposées par DK HOMETECH. Les stocks sont limités ; une promotion peut être retirée dès rupture de stock. Les prix affichés sont valables jusqu’à la date d’expiration indiquée.',
            'newsletter_enabled' => false,
            'newsletter_frequency' => 'weekly',
            'expiry_alert_days' => 2,
            'default_vendor_name' => 'DK HOMETECH',
        ];
    }

    public function settings(): array
    {
        $stored = Setting::query()->where('key', 'promo')->value('value');
        $value = is_array($stored) ? $stored : [];

        return array_replace_recursive(self::defaultSettings(), $value);
    }

    public function updateSettings(array $payload): array
    {
        $merged = array_replace_recursive($this->settings(), $payload);
        Setting::query()->updateOrCreate(
            ['key' => 'promo'],
            ['value' => $merged]
        );

        return $this->settings();
    }

    public function preparePayload(array $data, ?Promotion $existing = null): array
    {
        $settings = $this->settings();
        $original = (int) ($data['price_original'] ?? $existing?->price_original ?? 0);
        $promo = (int) ($data['price_promo'] ?? $existing?->price_promo ?? 0);

        if ($promo >= $original || $original <= 0) {
            throw ValidationException::withMessages([
                'price_promo' => 'Le prix promo doit être strictement inférieur au prix original.',
            ]);
        }

        $percent = Promotion::computeDiscountPercent($original, $promo);
        $min = (float) $settings['min_discount_percent'];
        $max = (float) $settings['max_discount_percent'];

        if ($percent < $min || $percent > $max) {
            throw ValidationException::withMessages([
                'price_promo' => "La réduction doit être entre {$min}% et {$max}% (actuellement {$percent}%).",
            ]);
        }

        $start = isset($data['start_date']) ? \Carbon\Carbon::parse($data['start_date']) : ($existing?->start_date ?? now());
        $end = isset($data['end_date']) ? \Carbon\Carbon::parse($data['end_date']) : ($existing?->end_date ?? now()->addDays(7));

        if ($end <= $start) {
            throw ValidationException::withMessages([
                'end_date' => 'La date de fin doit être postérieure à la date de début.',
            ]);
        }

        $days = $start->diffInDays($end);
        $minDays = (int) $settings['min_duration_days'];
        $maxDays = (int) $settings['max_duration_days'];
        if ($days < $minDays || $days > $maxDays) {
            throw ValidationException::withMessages([
                'end_date' => "La durée doit être entre {$minDays} et {$maxDays} jours (actuellement {$days}).",
            ]);
        }

        $status = $data['status'] ?? $existing?->status ?? 'draft';
        if (! empty($settings['require_approval']) && $status === 'active' && ! $existing) {
            $status = 'draft';
        }

        if (array_key_exists('stock_quantity', $data) && $data['stock_quantity'] !== null && (int) $data['stock_quantity'] <= 0) {
            $status = 'out_of_stock';
        }

        if ($status === 'active') {
            $activeCount = Promotion::query()
                ->where('status', 'active')
                ->when($existing, fn ($q) => $q->where('id', '!=', $existing->id))
                ->count();
            $maxActive = (int) $settings['max_active'];
            if ($activeCount >= $maxActive) {
                throw ValidationException::withMessages([
                    'status' => "Nombre max de promotions actives atteint ({$maxActive}).",
                ]);
            }
        }

        $data['price_original'] = $original;
        $data['price_promo'] = $promo;
        $data['discount_percent'] = $percent;
        $data['discount_type'] = $data['discount_type'] ?? 'percent';
        $data['start_date'] = $start;
        $data['end_date'] = $end;
        $data['status'] = $status;
        $data['vendor_name'] = $data['vendor_name']
            ?? $existing?->vendor_name
            ?? $settings['default_vendor_name'];

        return $data;
    }

    public function audit(Promotion $promo, string $action, ?array $before = null, ?array $after = null): void
    {
        PromotionAudit::query()->create([
            'promotion_id' => $promo->id,
            'user_id' => Auth::id(),
            'action' => $action,
            'before' => $before,
            'after' => $after ?? $promo->only([
                'price_original', 'price_promo', 'discount_percent', 'status', 'stock_quantity', 'end_date',
            ]),
        ]);
    }

    public function refreshStatuses(): array
    {
        $now = now();
        $expired = Promotion::query()
            ->whereIn('status', ['active', 'draft'])
            ->where('end_date', '<', $now)
            ->update(['status' => 'expired']);

        $oos = Promotion::query()
            ->where('status', 'active')
            ->whereNotNull('stock_quantity')
            ->where('stock_quantity', '<=', 0)
            ->update(['status' => 'out_of_stock']);

        return ['expired' => $expired, 'out_of_stock' => $oos];
    }
}
