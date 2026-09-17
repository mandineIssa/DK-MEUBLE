<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/** Stub Twilio — renseigner TWILIO_* dans .env pour activer */
class TwilioSmsSender implements SmsSender
{
    public function send(string $phone, string $message): void
    {
        $sid = config('services.twilio.sid');
        $token = config('services.twilio.token');
        $from = config('services.twilio.from');

        if (! $sid || ! $token || ! $from) {
            throw new RuntimeException('Twilio n\'est pas configuré (TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM).');
        }

        $to = str_starts_with($phone, '+') ? $phone : '+'.$phone;

        $response = Http::withBasicAuth($sid, $token)
            ->asForm()
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                'From' => $from,
                'To' => $to,
                'Body' => $message,
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('Échec envoi SMS Twilio: '.$response->body());
        }
    }
}
