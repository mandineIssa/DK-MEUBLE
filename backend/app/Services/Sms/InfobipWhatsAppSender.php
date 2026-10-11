<?php

namespace App\Services\Sms;

use App\Services\NotificationSettings;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/** Message WhatsApp texte via Infobip, vers les numéros de la boutique. */
class InfobipWhatsAppSender
{
    public function send(string $phone, string $message): void
    {
        $base = $this->baseUrl();
        $key = trim((string) config('services.infobip.api_key'));
        $from = $this->from();

        if ($base === '' || $key === '' || $from === '') {
            throw new RuntimeException('WhatsApp Infobip n\'est pas configuré (clé API et numéro expéditeur).');
        }

        $response = $this->http()
            ->withHeaders([
                'Authorization' => 'App '.$key,
            ])
            ->post($base.'/whatsapp/1/message/text', [
                'from' => $from,
                'to' => $this->recipient($phone),
                'content' => [
                    'text' => $message,
                ],
            ]);

        if (! $response->successful()) {
            $detail = (string) (
                $response->json('requestError.serviceException.text')
                ?: $response->json('description')
                ?: ('erreur '.$response->status())
            );
            throw new RuntimeException('Échec envoi WhatsApp Infobip: '.$detail);
        }
    }

    private function from(): string
    {
        $settings = NotificationSettings::get();
        $from = preg_replace('/\D+/', '', (string) ($settings['activity_whatsapp_from'] ?? '')) ?: '';
        if ($from === '') {
            $from = preg_replace('/\D+/', '', (string) config('services.infobip.whatsapp_from')) ?: '';
        }

        return $from;
    }

    private function http(): \Illuminate\Http\Client\PendingRequest
    {
        $pending = Http::acceptJson()->timeout(15);
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
        if (strlen($digits) < 11) {
            throw new RuntimeException('Numéro WhatsApp invalide.');
        }

        return $digits;
    }
}
