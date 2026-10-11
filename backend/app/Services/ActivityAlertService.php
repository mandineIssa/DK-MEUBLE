<?php

namespace App\Services;

use App\Mail\TemplatedNotificationMail;
use App\Models\AppNotification;
use App\Models\NotificationDeliveryLog;
use App\Services\Sms\InfobipWhatsAppSender;
use App\Services\Sms\SmsSender;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/** Alertes boutique : e-mail, SMS et WhatsApp vers des destinataires configurables. */
class ActivityAlertService
{
    public function __construct(
        private SmsSender $sms,
        private InfobipWhatsAppSender $whatsapp,
    ) {
    }

    /** @param  array<string, scalar|null>  $vars */
    public function notify(string $type, array $vars): void
    {
        try {
            $settings = NotificationSettings::get();
            if (empty($settings['types_enabled'][$type])) {
                return;
            }

            $emails = $this->emails((string) ($settings['activity_alert_emails'] ?? ''));
            $phones = $this->phones((string) ($settings['activity_alert_phones'] ?? ''));
            if ($emails === [] && $phones === []) {
                return;
            }

            [$title, $body] = $this->copy($type, $vars);
            $notification = AppNotification::query()->create([
                'type' => $type,
                'title' => $title,
                'message' => $body,
                'data' => $vars,
                'is_read' => false,
            ]);

            foreach ($emails as $email) {
                $this->deliver($notification, 'email', $email, function () use ($email, $title, $body) {
                    Mail::to($email)->send(new TemplatedNotificationMail($title, $body));
                });
            }

            foreach ($phones as $phone) {
                $this->deliver($notification, 'sms', $phone, function () use ($phone, $body) {
                    $this->sms->send($phone, $body);
                });
                $this->deliver($notification, 'whatsapp', $phone, function () use ($phone, $body) {
                    $this->whatsapp->send($phone, $body);
                });
            }
        } catch (\Throwable $e) {
            Log::warning('activity_alert_failed', ['type' => $type, 'error' => $e->getMessage()]);
        }
    }

    /** @param  array<string, scalar|null>  $vars */
    private function copy(string $type, array $vars): array
    {
        $name = trim((string) ($vars['customer_name'] ?? '')) ?: 'Client';
        $email = trim((string) ($vars['customer_email'] ?? ''));
        $phone = trim((string) ($vars['customer_phone'] ?? ''));
        $contact = trim($email.($email && $phone ? ' / ' : '').$phone) ?: 'contact non renseigné';

        return match ($type) {
            'account_created' => [
                'Nouveau compte DK HOMETECH',
                "Nouveau compte créé.\nNom : {$name}\nContact : {$contact}",
            ],
            'cart_added' => [
                'Ajout au panier DK HOMETECH',
                'Ajout au panier : '.trim((string) ($vars['product_name'] ?? 'Produit'))
                    .' x'.max(1, (int) ($vars['quantity'] ?? 1))
                    ."\nClient : {$name} ({$contact})",
            ],
            'order_placed' => [
                'Nouvelle commande DK HOMETECH',
                'Nouvelle commande '.(string) ($vars['order_number'] ?? '')
                    ."\nClient : {$name} ({$contact})"
                    ."\nTotal : ".(string) ($vars['order_total'] ?? '').' FCFA',
            ],
            default => [
                'Activité DK HOMETECH',
                "Activité boutique : {$type}\nClient : {$name} ({$contact})",
            ],
        };
    }

    /** @return list<string> */
    private function emails(string $raw): array
    {
        $out = [];
        foreach (preg_split('/[\s,;]+/', $raw) ?: [] as $part) {
            $email = strtolower(trim($part));
            if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $out[$email] = $email;
            }
        }

        return array_values($out);
    }

    /** @return list<string> */
    private function phones(string $raw): array
    {
        $out = [];
        foreach (preg_split('/[\s,;]+/', $raw) ?: [] as $part) {
            $digits = preg_replace('/\D+/', '', $part) ?: '';
            if (str_starts_with($digits, '00')) {
                $digits = substr($digits, 2);
            }
            if (strlen($digits) === 9 && str_starts_with($digits, '7')) {
                $digits = '221'.$digits;
            }
            if (strlen($digits) >= 11) {
                $out[$digits] = $digits;
            }
        }

        return array_values($out);
    }

    private function deliver(AppNotification $notification, string $channel, string $recipient, callable $send): void
    {
        try {
            $send();
            $this->log($notification, $channel, $recipient, 'sent', null);
        } catch (\Throwable $e) {
            $this->log($notification, $channel, $recipient, 'failed', $e->getMessage());
        }
    }

    private function log(AppNotification $notification, string $channel, string $recipient, string $status, ?string $error): void
    {
        NotificationDeliveryLog::query()->create([
            'notification_id' => $notification->id,
            'type' => $notification->type,
            'channel' => $channel,
            'recipient' => $recipient,
            'status' => $status,
            'error' => $error,
            'attempts' => 1,
            'sent_at' => $status === 'sent' ? now() : null,
        ]);
    }
}
