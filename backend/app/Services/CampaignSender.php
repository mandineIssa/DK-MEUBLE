<?php

namespace App\Services;

use App\Mail\PromoCampaignMail;
use App\Models\Campaign;
use App\Models\Customer;
use App\Services\Sms\SmsSender;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class CampaignSender
{
    public function __construct(private SmsSender $sms) {}

    public function send(Campaign $campaign): Campaign
    {
        $campaign->update(['status' => 'sending']);

        $customers = Customer::query()
            ->when($campaign->audience === 'b2b', fn ($q) => $q->where('is_b2b', true))
            ->when($campaign->audience === 'opt_in', fn ($q) => $q->where(function ($qq) {
                $qq->where('sms_opt_in', true)->orWhere('email_opt_in', true);
            }))
            ->get();

        $sentSms = 0;
        $sentEmail = 0;
        $failed = 0;

        $wantSms = in_array($campaign->channel, ['sms', 'both'], true);
        $wantEmail = in_array($campaign->channel, ['email', 'both'], true);
        $subject = $campaign->subject ?: $campaign->title;

        foreach ($customers as $customer) {
            if ($wantSms && $customer->sms_opt_in && $customer->phone) {
                try {
                    $this->sms->send($customer->phone, $this->truncateSms($campaign->body));
                    $sentSms++;
                } catch (\Throwable $e) {
                    $failed++;
                    Log::warning('Campaign SMS failed', ['customer' => $customer->id, 'error' => $e->getMessage()]);
                }
            }

            if ($wantEmail && $customer->email_opt_in && $customer->email) {
                try {
                    Mail::to($customer->email)->send(
                        new PromoCampaignMail($campaign->title, $subject, $campaign->body)
                    );
                    $sentEmail++;
                } catch (\Throwable $e) {
                    $failed++;
                    Log::warning('Campaign email failed', ['customer' => $customer->id, 'error' => $e->getMessage()]);
                }
            }
        }

        $campaign->update([
            'status' => 'sent',
            'sent_sms' => $sentSms,
            'sent_email' => $sentEmail,
            'failed' => $failed,
            'sent_at' => now(),
        ]);

        return $campaign->fresh();
    }

    private function truncateSms(string $body): string
    {
        $prefix = 'DK MEUBLE: ';
        $max = 160 - strlen($prefix);
        $text = trim($body);
        if (mb_strlen($text) > $max) {
            $text = mb_substr($text, 0, $max - 1).'…';
        }

        return $prefix.$text;
    }
}
