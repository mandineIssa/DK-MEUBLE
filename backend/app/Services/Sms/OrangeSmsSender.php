<?php

namespace App\Services\Sms;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/** SMS Sénégal via Orange Developer (OAuth client credentials, jeton valable 1 h). */
class OrangeSmsSender implements SmsSender
{
    public function send(string $phone, string $message): void
    {
        $clientId = (string) config('services.orange_sms.client_id');
        $clientSecret = (string) config('services.orange_sms.client_secret');
        $sender = $this->senderNumber();

        if ($clientId === '' || $clientSecret === '') {
            throw new RuntimeException('Orange SMS n\'est pas configuré (ORANGE_SMS_CLIENT_ID, ORANGE_SMS_CLIENT_SECRET).');
        }

        $to = $this->recipient($phone);
        $token = $this->token($clientId, $clientSecret);
        $response = $this->postSms($token, $sender, $to, $message);

        if ($response->status() === 401) {
            Cache::forget($this->cacheKey());
            $token = $this->token($clientId, $clientSecret);
            $response = $this->postSms($token, $sender, $to, $message);
        }

        if (! $response->successful()) {
            $detail = (string) ($response->json('message') ?: $response->json('description') ?: ('erreur '.$response->status()));
            throw new RuntimeException('Échec envoi SMS Orange: '.$detail);
        }
    }

    private function postSms(string $token, string $sender, string $to, string $message): Response
    {
        $base = rtrim((string) config('services.orange_sms.base_url'), '/');
        $url = $base.'/outbound/tel%3A%2B'.$sender.'/requests';

        $request = [
            'address' => 'tel:+'.$to,
            'senderAddress' => 'tel:+'.$sender,
            'outboundSMSTextMessage' => [
                'message' => $message,
            ],
        ];

        $senderName = trim((string) config('services.orange_sms.sender_name'));
        if ($senderName !== '') {
            $request['senderName'] = $senderName;
        }

        return Http::withToken($token)
            ->acceptJson()
            ->timeout(15)
            ->post($url, [
                'outboundSMSMessageRequest' => $request,
            ]);
    }

    private function token(string $clientId, string $clientSecret): string
    {
        return Cache::remember($this->cacheKey(), 3300, function () use ($clientId, $clientSecret) {
            $response = Http::asForm()
                ->withBasicAuth($clientId, $clientSecret)
                ->acceptJson()
                ->timeout(15)
                ->post((string) config('services.orange_sms.token_url'), [
                    'grant_type' => 'client_credentials',
                ]);

            $accessToken = $response->json('access_token');
            if (! $response->successful() || ! is_string($accessToken) || $accessToken === '') {
                throw new RuntimeException('Orange SMS : impossible d\'obtenir un jeton. Vérifiez l\'identifiant et le secret client.');
            }

            return $accessToken;
        });
    }

    private function senderNumber(): string
    {
        $digits = preg_replace('/\D+/', '', (string) config('services.orange_sms.sender')) ?: '';

        return $digits !== '' ? $digits : '2210000';
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

    private function cacheKey(): string
    {
        return 'orange_sms_access_token';
    }
}
