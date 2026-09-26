<?php

namespace App\Services;

use App\Models\OtpCode;
use App\Services\Sms\SmsSender;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class OtpService
{
    public function __construct(private SmsSender $sms) {}

    public function requestPhone(string $phone): string
    {
        $phone = $this->normalizePhone($phone);
        $plain = $this->storeOtp('phone', $phone, null);

        $this->sms->send(
            $phone,
            "DK HOMETECH : votre code est {$plain}. Valable 5 minutes."
        );

        return $plain;
    }

    public function requestEmail(string $email): string
    {
        $email = $this->normalizeEmail($email);
        $plain = $this->storeOtp('email', null, $email);

        $fromName = config('mail.from.name', 'DK HOMETECH');
        $mailer = config('mail.default');

        // En log/array : pas d’envoi réel (le code est renvoyé en debug par le contrôleur).
        if (! in_array($mailer, ['log', 'array'], true)) {
            try {
                Mail::raw(
                    "Bonjour,\n\nVotre code de connexion {$fromName} est : {$plain}\n\nValable 5 minutes.\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.",
                    function ($message) use ($email, $fromName) {
                        $message->to($email)->subject("{$fromName} — code de connexion");
                    }
                );
            } catch (\Throwable $e) {
                if (! app()->environment('local')) {
                    throw $e;
                }
                // Local + SMTP mal configuré : on laisse quand même tester via debug_code.
                report($e);
            }
        }

        return $plain;
    }

    /** @deprecated Utiliser requestPhone() */
    public function request(string $phone): string
    {
        return $this->requestPhone($phone);
    }

    public function verifyPhone(string $phone, string $code): void
    {
        $this->verifyChannel('phone', $this->normalizePhone($phone), $code);
    }

    public function verifyEmail(string $email, string $code): void
    {
        $this->verifyChannel('email', $this->normalizeEmail($email), $code);
    }

    /** @deprecated Utiliser verifyPhone() */
    public function verify(string $phone, string $code): void
    {
        $this->verifyPhone($phone, $code);
    }

    protected function storeOtp(string $channel, ?string $phone, ?string $email): string
    {
        $plain = (string) random_int(100000, 999999);

        $query = OtpCode::query()->where('channel', $channel);
        if ($channel === 'phone') {
            $query->where('phone', $phone);
        } else {
            $query->where('email', $email);
        }
        $query->delete();

        OtpCode::query()->create([
            'channel' => $channel,
            'phone' => $phone,
            'email' => $email,
            'code' => Hash::make($plain),
            'expires_at' => now()->addMinutes(5),
            'attempts' => 0,
        ]);

        return $plain;
    }

    protected function verifyChannel(string $channel, string $identifier, string $code): void
    {
        $otp = OtpCode::query()
            ->where('channel', $channel)
            ->when(
                $channel === 'phone',
                fn ($q) => $q->where('phone', $identifier),
                fn ($q) => $q->where('email', $identifier)
            )
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

        if (strlen($digits) >= 11) {
            return $digits;
        }

        if (strlen($digits) === 9) {
            return '221'.$digits;
        }

        return $digits;
    }

    public function normalizeEmail(string $email): string
    {
        return strtolower(trim($email));
    }
}
