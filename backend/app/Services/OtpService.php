<?php

namespace App\Services;

use App\Models\OtpCode;
use App\Services\Sms\SmsSender;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class OtpService
{
    public function __construct(private SmsSender $sms) {}

    public function request(string $phone): string
    {
        $phone = $this->normalizePhone($phone);
        $plain = (string) random_int(100000, 999999);

        OtpCode::query()->where('phone', $phone)->delete();

        OtpCode::query()->create([
            'phone' => $phone,
            'code' => Hash::make($plain),
            'expires_at' => now()->addMinutes(5),
            'attempts' => 0,
        ]);

        $this->sms->send(
            $phone,
            "DK MEUBLE : votre code est {$plain}. Valable 5 minutes."
        );

        return $plain;
    }

    public function verify(string $phone, string $code): void
    {
        $phone = $this->normalizePhone($phone);

        $otp = OtpCode::query()
            ->where('phone', $phone)
            ->latest()
            ->first();

        if (! $otp || $otp->isExpired()) {
            throw ValidationException::withMessages([
                'code' => ['Code expiré ou invalide. Demandez un nouveau code.'],
            ]);
        }

        if ($otp->hasTooManyAttempts(5)) {
            $otp->delete();
            throw ValidationException::withMessages([
                'code' => ['Trop de tentatives. Demandez un nouveau code.'],
            ]);
        }

        if (! Hash::check($code, $otp->code)) {
            $otp->increment('attempts');
            throw ValidationException::withMessages([
                'code' => ['Code incorrect.'],
            ]);
        }

        $otp->delete();
    }

    public function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?: '';

        if (str_starts_with($digits, '00')) {
            $digits = substr($digits, 2);
        }

        // Déjà avec indicatif (ex. 22177…)
        if (strlen($digits) >= 11) {
            return $digits;
        }

        // Numéro local SN à 9 chiffres
        if (strlen($digits) === 9) {
            return '221'.$digits;
        }

        return $digits;
    }
}
