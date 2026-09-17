<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Log;

/** Driver local / staging : logue le SMS (le code OTP apparaît dans storage/logs) */
class LogSmsSender implements SmsSender
{
    public function send(string $phone, string $message): void
    {
        Log::info('[SMS]', ['to' => $phone, 'message' => $message]);
    }
}
