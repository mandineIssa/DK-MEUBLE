<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/** SMS via Infobip (API SMS 3). */
class InfobipSmsSender implements SmsSender
{
    public function send(string $phone, string $message): void
    {
        $base = $this->baseUrl();
        $key = trim((string) config('services.infobip.api_key'));
        $sender = trim((string) config('services.infobip.sender'));

        if ($base === '' || $key === '' || $sender === '') {
            throw new RuntimeException('Infobip n\'est pas configuré (INFOBIP_BASE_URL, INFOBIP_API_KEY, INFOBIP_SENDER).');
        }

        $response = $this->http()
            ->withHeaders([
                'Authorization' => 'App '.$key,
            ])
            ->post($base.'/sms/3/messages', [
                'messages' => [[
                    'sender' => $sender,
                    'destinations' => [[
                        'to' => $this->recipient($phone),
                    ]],
                    'content' => [
                        'text' => $message,
                    ],
                ]],
            ]);

        if (! $response->successful()) {
            $detail = (string) (
                $response->json('requestError.serviceException.text')
                ?: $response->json('description')
                ?: ('erreur '.$response->status())
            );
            throw new RuntimeException('Échec envoi SMS Infobip: '.$detail);
        }

        $status = $response->json('messages.0.status');
        $group = is_array($status) ? strtoupper((string) ($status['groupName'] ?? '')) : '';
        if (in_array($group, ['REJECTED', 'UNDELIVERABLE'], true)) {
            $detail = (string) ($status['description'] ?? $status['name'] ?? $group);
            throw new RuntimeException('Échec envoi SMS Infobip: '.$detail);
        }
    }

    private function http(): \Illuminate\Http\Client\PendingRequest
    {
        $pending = Http::acceptJson()->timeout(15);
        // PHP sous Windows n’utilise pas le magasin de certificats du système.
        if (PHP_OS_FAMILY === 'Windows' && defined('CURLSSLOPT_NATIVE_CA')) {
            $pending = $pending->withOptions([
                'curl' => [CURLOPT_SSL_OPTIONS => CURLSSLOPT_NATIVE_CA],
            ]);
        }

        return $pending;
    }

    private function baseUrl(): string
    {
        $base = rtrim(trim((string) config('services.infobip.base_url')), '/');
        if ($base === '') {
            return '';
        }
        if (! str_starts_with($base, 'http://') && ! str_starts_with($base, 'https://')) {
            $base = 'https://'.$base;
        }

        return $base;
    }

    private function recipient(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?: '';

        if (str_starts_with($digits, '00')) {
            $digits = substr($digits, 2);
        }

        if (strlen($digits) === 9) {
            $digits = '221'.$digits;
        }

        if (! str_starts_with($digits, '221') || strlen($digits) < 12) {
            throw new RuntimeException('Numéro SMS invalide.');
        }

        return $digits;
    }
}
