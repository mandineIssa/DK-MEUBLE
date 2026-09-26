<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductChat;
use App\Models\ProductChatMessage;
use App\Models\Setting;
use App\Services\Sms\SmsSender;
use Illuminate\Support\Facades\Log;

class ProductChatService
{
    public function __construct(private SmsSender $sms) {}

    /**
     * Après un message client : forward WhatsApp/SMS boutique + éventuelle auto-réponse.
     *
     * @return list<ProductChatMessage>
     */
    public function afterCustomerMessage(
        ProductChat $chat,
        ProductChatMessage $customerMessage,
        Customer $customer,
        NotificationService $notifications,
    ): array {
        $chat->loadMissing(['product.promotions', 'product.brand']);

        $this->notifyAdmins($chat, $customerMessage, $customer, $notifications);
        $this->forwardToShopWhatsApp($chat, $customerMessage, $customer);

        return $this->maybeAutoReply($chat, $customerMessage, $customer);
    }

    protected function notifyAdmins(
        ProductChat $chat,
        ProductChatMessage $msg,
        Customer $customer,
        NotificationService $notifications,
    ): void {
        $notifications->notifyAdmins(
            'chat_message',
            [
                'customer_name' => $customer->name ?: $customer->phone,
                'customer_phone' => $customer->phone ?: '',
                'product_name' => $chat->product?->name ?? '',
                'message' => $msg->body,
                'link' => '/admin/notifications',
            ],
            '/admin/notifications',
        );
    }

    protected function forwardToShopWhatsApp(
        ProductChat $chat,
        ProductChatMessage $msg,
        Customer $customer,
    ): void {
        $settings = NotificationSettings::get();
        if (($settings['chat_forward_to_whatsapp'] ?? true) === false) {
            return;
        }

        $to = $this->resolveShopWhatsAppNumber($settings);
        if ($to === '') {
            Log::warning('chat_whatsapp_forward_skipped', ['reason' => 'numéro non configuré']);

            return;
        }

        $product = $chat->product;
        $price = $this->formatProductPrice($product);
        $text = implode("\n", [
            '💬 Chat produit DK HOMETECH',
            'Produit : '.($product?->name ?? '—'),
            'Prix : '.$price,
            'Client : '.($customer->name ?: '—').' / '.($customer->phone ?: '—'),
            'Message : '.$msg->body,
            'Admin : /admin/notifications',
        ]);

        try {
            $this->sms->send($to, $text);
            Log::channel('single')->info('chat_whatsapp_forward', [
                'to' => $to,
                'chat_id' => $chat->id,
                'message_id' => $msg->id,
                'body' => $text,
            ]);
        } catch (\Throwable $e) {
            Log::error('chat_whatsapp_forward_failed', [
                'to' => $to,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * @return list<ProductChatMessage>
     */
    protected function maybeAutoReply(
        ProductChat $chat,
        ProductChatMessage $customerMessage,
        Customer $customer,
    ): array {
        $settings = NotificationSettings::get();
        if (($settings['chat_auto_reply_enabled'] ?? true) === false) {
            return [];
        }

        $body = mb_strtolower(trim($customerMessage->body));
        $replies = [];

        if ($this->isGreeting($body) && ! $this->recentBotReplyContains($chat, 'Bonjour')) {
            $tpl = (string) ($settings['chat_greeting_reply']
                ?? 'Bonjour {{customer_name}} ! Merci pour votre intérêt pour {{product_name}}. Comment pouvons-nous vous aider ?');
            $replies[] = $this->createBotReply($chat, $this->render($tpl, $chat, $customer));
        }

        if ($this->isPriceQuestion($body) && ! $this->recentBotReplyContains($chat, 'FCFA') && ! $this->recentBotReplyContains($chat, 'sur devis')) {
            $tpl = (string) ($settings['chat_price_reply']
                ?? '{{product_name}} est à {{product_price}}. Souhaitez-vous plus d’infos ou un devis ?');
            $replies[] = $this->createBotReply($chat, $this->render($tpl, $chat, $customer));
        }

        if ($replies !== []) {
            $chat->update(['last_message_at' => now()]);
        }

        return $replies;
    }

    protected function recentBotReplyContains(ProductChat $chat, string $needle): bool
    {
        return ProductChatMessage::query()
            ->where('product_chat_id', $chat->id)
            ->where('sender_type', 'admin')
            ->where('sender_id', 0)
            ->where('created_at', '>=', now()->subHours(6))
            ->where('body', 'like', '%'.$needle.'%')
            ->exists();
    }

    protected function createBotReply(ProductChat $chat, string $body): ProductChatMessage
    {
        return ProductChatMessage::query()->create([
            'product_chat_id' => $chat->id,
            'sender_type' => 'admin',
            'sender_id' => 0, // bot système
            'body' => $body,
            'is_read' => true,
        ]);
    }

    protected function render(string $template, ProductChat $chat, Customer $customer): string
    {
        $product = $chat->product;
        $vars = [
            'customer_name' => $customer->name ?: 'cher client',
            'customer_phone' => $customer->phone ?: '',
            'product_name' => $product?->name ?? 'cet article',
            'product_price' => $this->formatProductPrice($product),
            'product_slug' => $product?->slug ?? '',
        ];

        $out = $template;
        foreach ($vars as $key => $value) {
            $out = str_replace('{{'.$key.'}}', (string) $value, $out);
        }

        return $out;
    }

    protected function formatProductPrice(?Product $product): string
    {
        if (! $product) {
            return 'sur devis';
        }

        $effective = $product->effective_price;
        if ($effective === null) {
            return 'sur devis';
        }

        return number_format((int) $effective, 0, ',', ' ').' FCFA';
    }

    protected function isGreeting(string $body): bool
    {
        $patterns = [
            '/\bbonjour\b/u',
            '/\bbonsoir\b/u',
            '/\bsalut\b/u',
            '/\bhello\b/u',
            '/\bhi\b/u',
            '/\bsalaam\b/u',
            '/\bassalam\b/u',
            '/\bbonne\s+journ/u',
        ];

        foreach ($patterns as $p) {
            if (preg_match($p, $body)) {
                return true;
            }
        }

        return false;
    }

    protected function isPriceQuestion(string $body): bool
    {
        $patterns = [
            '/\bprix\b/u',
            '/\bcout\b/u',
            '/\bcoût\b/u',
            '/\bcombien\b/u',
            '/\btarif\b/u',
            '/\bcout[eé]\b/u',
            '/\bcoûte\b/u',
            '/\bfcfa\b/u',
            '/\bmontant\b/u',
        ];

        foreach ($patterns as $p) {
            if (preg_match($p, $body)) {
                return true;
            }
        }

        return false;
    }

    protected function resolveShopWhatsAppNumber(array $settings): string
    {
        $configured = $this->normalizePhone((string) ($settings['chat_whatsapp_number'] ?? ''));
        if ($configured !== '') {
            return $configured;
        }

        // Fallback : contact.whatsapp des réglages site
        $contact = Setting::query()->where('key', 'contact')->value('value');
        if (is_array($contact)) {
            $wa = $this->normalizePhone((string) ($contact['whatsapp'] ?? ''));
            if ($wa !== '') {
                return $wa;
            }
            $phones = $this->normalizePhone(explode(',', (string) ($contact['phones'] ?? ''))[0] ?? '');
            if ($phones !== '') {
                return $phones;
            }
        }

        return '';
    }

    protected function normalizePhone(string $raw): string
    {
        $digits = preg_replace('/\D+/', '', $raw) ?: '';
        if ($digits === '') {
            return '';
        }
        if (str_starts_with($digits, '00')) {
            $digits = substr($digits, 2);
        }
        // Local SN 9 chiffres → indicatif 221
        if (strlen($digits) === 9 && str_starts_with($digits, '7')) {
            return '221'.$digits;
        }

        return $digits;
    }
}
