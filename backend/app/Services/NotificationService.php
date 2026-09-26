<?php

namespace App\Services;

use App\Jobs\SendNotificationJob;
use App\Mail\TemplatedNotificationMail;
use App\Models\AppNotification;
use App\Models\Customer;
use App\Models\NotificationDeliveryLog;
use App\Models\NotificationPreference;
use App\Models\NotificationTemplate;
use App\Models\PushSubscription;
use App\Models\User;
use App\Services\Sms\SmsSender;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificationService
{
    public function __construct(private SmsSender $sms)
    {
    }

    public static function defaultTemplates(): array
    {
        return [
            ['type' => 'order_placed', 'channel' => 'in_app', 'subject' => null, 'body_template' => 'Commande {{order_number}} reçue. Total {{order_total}} FCFA.'],
            ['type' => 'order_placed', 'channel' => 'email', 'subject' => 'Commande {{order_number}} reçue', 'body_template' => "Bonjour {{customer_name}},\n\nVotre commande {{order_number}} a bien été enregistrée.\nTotal : {{order_total}} FCFA.\n\nMerci — DK HOMETECH"],
            ['type' => 'order_placed', 'channel' => 'sms', 'subject' => null, 'body_template' => 'DK HOMETECH : commande {{order_number}} reçue. Total {{order_total}} FCFA.'],
            ['type' => 'order_placed', 'channel' => 'whatsapp', 'subject' => null, 'body_template' => 'DK HOMETECH : commande {{order_number}} reçue. Total {{order_total}} FCFA. Merci !'],
            ['type' => 'order_status', 'channel' => 'in_app', 'subject' => null, 'body_template' => 'Commande {{order_number}} : {{order_status}}'],
            ['type' => 'order_status', 'channel' => 'email', 'subject' => 'Mise à jour commande {{order_number}}', 'body_template' => "Bonjour {{customer_name}},\n\nVotre commande {{order_number}} est maintenant : {{order_status}}.\n\nDK HOMETECH"],
            ['type' => 'order_status', 'channel' => 'whatsapp', 'subject' => null, 'body_template' => 'DK HOMETECH : commande {{order_number}} → {{order_status}}'],
            ['type' => 'price_drop', 'channel' => 'in_app', 'subject' => null, 'body_template' => '{{product_name}} a baissé : {{new_price}} FCFA (avant {{old_price}})'],
            ['type' => 'price_drop', 'channel' => 'email', 'subject' => 'Baisse de prix : {{product_name}}', 'body_template' => "Bonjour {{customer_name}},\n\n{{product_name}} est passé de {{old_price}} à {{new_price}} FCFA.\nVoir : {{link}}\n\nDK HOMETECH"],
            ['type' => 'back_in_stock', 'channel' => 'in_app', 'subject' => null, 'body_template' => '{{product_name}} est de retour en stock'],
            ['type' => 'back_in_stock', 'channel' => 'email', 'subject' => 'Retour en stock : {{product_name}}', 'body_template' => "Bonjour {{customer_name}},\n\n{{product_name}} est de nouveau disponible.\n{{link}}\n\nDK HOMETECH"],
            ['type' => 'favorite_removed', 'channel' => 'in_app', 'subject' => null, 'body_template' => '{{product_name}} n’est plus disponible'],
            ['type' => 'service_request', 'channel' => 'in_app', 'subject' => null, 'body_template' => 'Nouvelle demande service : {{service_name}} — {{customer_name}}'],
            ['type' => 'service_request', 'channel' => 'email', 'subject' => 'Demande de service {{service_name}}', 'body_template' => "Nouvelle demande de {{customer_name}} ({{customer_phone}}) pour {{service_name}}.\n{{link}}"],
            ['type' => 'content_report', 'channel' => 'in_app', 'subject' => null, 'body_template' => 'Signalement : {{reason}}'],
            ['type' => 'content_report', 'channel' => 'email', 'subject' => 'Signalement reçu', 'body_template' => "Un contenu a été signalé : {{reason}}\n{{details}}\n{{link}}"],
            ['type' => 'abandoned_cart', 'channel' => 'email', 'subject' => 'Votre panier vous attend', 'body_template' => "Bonjour {{customer_name}},\n\nVous avez laissé des articles dans votre panier.\nFinalisez ici : {{link}}\n\nDK HOMETECH"],
            ['type' => 'abandoned_cart', 'channel' => 'in_app', 'subject' => null, 'body_template' => 'Votre panier vous attend — finalisez votre commande'],
            ['type' => 'chat_message', 'channel' => 'in_app', 'subject' => null, 'body_template' => 'Nouveau message chat produit'],
            ['type' => 'chat_message', 'channel' => 'email', 'subject' => 'Nouveau message chat', 'body_template' => "Nouveau message reçu.\n{{link}}"],
            ['type' => 'chat_reply', 'channel' => 'in_app', 'subject' => null, 'body_template' => 'Réponse reçue dans votre chat'],
            ['type' => 'chat_reply', 'channel' => 'email', 'subject' => 'Réponse à votre message', 'body_template' => "Vous avez une réponse.\n{{link}}"],
            ['type' => 'newsletter', 'channel' => 'email', 'subject' => 'Meilleures offres DK HOMETECH', 'body_template' => "Découvrez nos meilleures offres de la semaine.\n{{link}}"],
            ['type' => 'promo_ending', 'channel' => 'in_app', 'subject' => null, 'body_template' => 'Promo bientôt terminée : {{product_name}}'],
            ['type' => 'promo_ending', 'channel' => 'email', 'subject' => 'Dernière chance : {{product_name}}', 'body_template' => "{{product_name}} : la promo se termine bientôt.\n{{link}}"],
        ];
    }

    public function seedTemplates(): int
    {
        $n = 0;
        foreach (self::defaultTemplates() as $row) {
            NotificationTemplate::query()->updateOrCreate(
                ['type' => $row['type'], 'channel' => $row['channel'], 'locale' => 'fr'],
                [
                    'subject' => $row['subject'],
                    'body_template' => $row['body_template'],
                    'is_active' => true,
                ]
            );
            $n++;
        }

        return $n;
    }

    public function render(string $template, array $vars): string
    {
        $out = $template;
        foreach ($vars as $key => $value) {
            $out = str_replace('{{'.$key.'}}', (string) $value, $out);
        }

        return preg_replace('/\{\{[a-zA-Z0-9_]+\}\}/', '', $out) ?? $out;
    }

    /**
     * @param  list<string>|null  $channels
     * @param  array<string, mixed>  $vars
     */
    public function notify(
        string $type,
        array $vars = [],
        ?Customer $customer = null,
        ?User $admin = null,
        ?string $link = null,
        ?array $channels = null,
        ?string $digestKey = null,
        bool $sync = false,
    ): ?AppNotification {
        $settings = NotificationSettings::get();
        if (($settings['types_enabled'][$type] ?? true) === false) {
            return null;
        }

        if (! $customer && ! $admin) {
            return null;
        }

        $channels = $channels ?: $this->defaultChannelsFor($type);
        $channels = $this->filterByPreferences($customer, $type, $channels, $settings);

        if ($digestKey && $customer) {
            $minutes = (int) ($settings['digest_minutes'] ?? 60);
            $existing = AppNotification::query()
                ->where('customer_id', $customer->id)
                ->where('type', $type)
                ->where('digest_key', $digestKey)
                ->where('created_at', '>=', now()->subMinutes(max(1, $minutes)))
                ->first();
            if ($existing) {
                return $existing;
            }
        }

        $title = $this->titleFor($type, $vars);
        $inAppBody = $this->bodyFor($type, 'in_app', $vars)
            ?: ($vars['message'] ?? $title);

        $notification = AppNotification::query()->create([
            'customer_id' => $customer?->id,
            'admin_user_id' => $admin?->id,
            'type' => $type,
            'title' => $title,
            'message' => $inAppBody,
            'link' => $link,
            'data' => $vars,
            'is_read' => false,
            'channel_sent' => [],
            'digest_key' => $digestKey,
        ]);

        if ($sync) {
            $this->deliver($notification, $channels, $vars);
        } else {
            SendNotificationJob::dispatch($notification->id, $channels, $vars);
        }

        return $notification;
    }

    /** Notify all admin users (or first admin). */
    public function notifyAdmins(string $type, array $vars = [], ?string $link = null, ?array $channels = null): void
    {
        $admins = User::query()->limit(20)->get();
        if ($admins->isEmpty()) {
            return;
        }
        foreach ($admins as $admin) {
            $this->notify($type, $vars, null, $admin, $link, $channels);
        }
    }

    /**
     * @param  list<string>  $channels
     * @param  array<string, mixed>  $vars
     */
    public function deliver(AppNotification $notification, array $channels, array $vars = []): void
    {
        $settings = NotificationSettings::get();
        $fallback = $settings['channel_fallback'] ?? ['whatsapp', 'sms', 'email'];
        $vars = array_merge($notification->data ?? [], $vars, [
            'link' => $notification->link ?? ($vars['link'] ?? ''),
        ]);

        $sent = [];
        $externalFailed = false;

        foreach ($channels as $channel) {
            if ($channel === 'in_app') {
                $sent[] = 'in_app';
                $this->logDelivery($notification, $channel, 'in_app', 'sent', null, $vars);

                continue;
            }

            $ok = $this->sendChannel($notification, $channel, $vars);
            if ($ok) {
                $sent[] = $channel;
            } else {
                $externalFailed = true;
            }
        }

        if ($externalFailed) {
            foreach ($fallback as $fb) {
                if (in_array($fb, $sent, true) || in_array($fb, $channels, true)) {
                    continue;
                }
                if ($this->sendChannel($notification, $fb, $vars)) {
                    $sent[] = $fb;
                    break;
                }
            }
        }

        $notification->update(['channel_sent' => array_values(array_unique($sent))]);
    }

    /**
     * @param  array<string, mixed>  $vars
     */
    protected function sendChannel(AppNotification $notification, string $channel, array $vars): bool
    {
        $customer = $notification->customer_id
            ? Customer::query()->find($notification->customer_id)
            : null;
        $admin = $notification->admin_user_id
            ? User::query()->find($notification->admin_user_id)
            : null;

        $body = $this->bodyFor($notification->type, $channel, $vars);
        if ($body === null || $body === '') {
            $body = $notification->message;
        }
        $subject = $this->subjectFor($notification->type, $channel, $vars) ?: $notification->title;

        $recipient = match ($channel) {
            'email' => $customer?->email ?: $admin?->email,
            'sms', 'whatsapp' => $customer?->phone,
            'push' => $customer ? 'push' : null,
            default => null,
        };

        if (! $recipient && ! in_array($channel, ['in_app', 'push'], true)) {
            $this->logDelivery($notification, $channel, null, 'failed', 'Destinataire manquant', $vars);

            return false;
        }

        try {
            if ($channel === 'email') {
                Mail::to($recipient)->send(new TemplatedNotificationMail($subject, $body));
            } elseif ($channel === 'sms') {
                $this->sms->send((string) $recipient, $body);
            } elseif ($channel === 'whatsapp') {
                // Provider log / futur API WhatsApp Business
                Log::channel('single')->info('whatsapp_notification', [
                    'to' => $recipient,
                    'body' => $body,
                    'type' => $notification->type,
                ]);
            } elseif ($channel === 'push') {
                if (! (NotificationSettings::get()['push_enabled'] ?? true)) {
                    $this->logDelivery($notification, $channel, null, 'failed', 'Push désactivé', $vars);

                    return false;
                }
                if (! $customer) {
                    $this->logDelivery($notification, $channel, null, 'failed', 'Destinataire manquant', $vars);

                    return false;
                }
                $subs = PushSubscription::query()->where('customer_id', $customer->id)->get();
                if ($subs->isEmpty()) {
                    $this->logDelivery($notification, $channel, null, 'failed', 'Aucune subscription push', $vars);

                    return false;
                }
                foreach ($subs as $sub) {
                    Log::channel('single')->info('web_push_notification', [
                        'endpoint' => $sub->endpoint,
                        'title' => $subject,
                        'body' => $body,
                        'type' => $notification->type,
                        'link' => $vars['link'] ?? null,
                    ]);
                }
                $recipient = (string) $subs->count().' subscription(s)';
            } else {
                return false;
            }

            $this->logDelivery($notification, $channel, (string) $recipient, 'sent', null, $vars);

            return true;
        } catch (\Throwable $e) {
            $this->logDelivery($notification, $channel, (string) $recipient, 'failed', $e->getMessage(), $vars);

            return false;
        }
    }

    /**
     * @param  array<string, mixed>  $vars
     */
    protected function logDelivery(
        AppNotification $notification,
        string $channel,
        ?string $recipient,
        string $status,
        ?string $error,
        array $vars,
    ): void {
        NotificationDeliveryLog::query()->create([
            'notification_id' => $notification->id,
            'type' => $notification->type,
            'channel' => $channel,
            'recipient' => $recipient,
            'status' => $status,
            'error' => $error,
            'attempts' => 1,
            'payload' => ['vars' => $vars],
            'sent_at' => $status === 'sent' ? now() : null,
        ]);
    }

    /** @return list<string> */
    protected function defaultChannelsFor(string $type): array
    {
        return match ($type) {
            'order_placed' => ['in_app', 'email', 'sms', 'whatsapp'],
            'order_status' => ['in_app', 'email', 'whatsapp', 'push'],
            'price_drop', 'back_in_stock', 'promo_ending' => ['in_app', 'email', 'push'],
            'favorite_removed', 'chat_reply' => ['in_app', 'push'],
            'service_request', 'content_report', 'chat_message' => ['in_app', 'email'],
            'abandoned_cart', 'newsletter', 'category_promo' => ['email', 'in_app'],
            default => ['in_app', 'email'],
        };
    }

    /**
     * @param  list<string>  $channels
     * @return list<string>
     */
    protected function filterByPreferences(?Customer $customer, string $type, array $channels, array $settings): array
    {
        if (! $customer) {
            return $channels;
        }

        $critical = $settings['critical_types'] ?? ['order_placed', 'order_status'];
        if (in_array($type, $critical, true)) {
            return $channels;
        }

        $pref = NotificationPreference::query()
            ->where('customer_id', $customer->id)
            ->where('type', $type)
            ->first();

        if (! $pref) {
            // Opt-in globaux client
            return array_values(array_filter($channels, function ($ch) use ($customer) {
                if ($ch === 'email' && $customer->email_opt_in === false) {
                    return false;
                }
                if ($ch === 'sms' && $customer->sms_opt_in === false) {
                    return false;
                }

                return true;
            }));
        }

        return array_values(array_filter($channels, function ($ch) use ($pref) {
            return match ($ch) {
                'email' => $pref->email_enabled,
                'sms' => $pref->sms_enabled,
                'whatsapp' => $pref->whatsapp_enabled,
                'in_app' => $pref->in_app_enabled,
                'push' => $pref->in_app_enabled, // aligné sur in-app jusqu’à colonne dédiée
                default => false,
            };
        }));
    }

    /** @param  array<string, mixed>  $vars */
    protected function titleFor(string $type, array $vars): string
    {
        return match ($type) {
            'order_placed' => 'Commande reçue',
            'order_status' => 'Statut de commande mis à jour',
            'price_drop' => 'Baisse de prix sur un favori',
            'back_in_stock' => 'Retour en stock',
            'favorite_removed' => 'Produit favori indisponible',
            'service_request' => 'Nouvelle demande de service',
            'content_report' => 'Nouveau signalement',
            'abandoned_cart' => 'Panier abandonné',
            'chat_message' => 'Nouveau message chat',
            'chat_reply' => 'Réponse chat',
            'newsletter' => 'Newsletter',
            'promo_ending' => 'Fin de promotion',
            'category_promo' => 'Nouvelles promotions',
            default => $vars['title'] ?? 'Notification',
        };
    }

    /** @param  array<string, mixed>  $vars */
    protected function bodyFor(string $type, string $channel, array $vars): ?string
    {
        $tpl = NotificationTemplate::query()
            ->where('type', $type)
            ->where('channel', $channel)
            ->where('is_active', true)
            ->first();

        if (! $tpl) {
            return null;
        }

        return $this->render($tpl->body_template, $vars);
    }

    /** @param  array<string, mixed>  $vars */
    protected function subjectFor(string $type, string $channel, array $vars): ?string
    {
        $tpl = NotificationTemplate::query()
            ->where('type', $type)
            ->where('channel', $channel)
            ->where('is_active', true)
            ->first();

        if (! $tpl?->subject) {
            return null;
        }

        return $this->render($tpl->subject, $vars);
    }
}
