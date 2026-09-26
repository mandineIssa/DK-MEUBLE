<?php

namespace App\Services;

use App\Models\Brand;
use App\Models\FooterColumn;
use App\Models\FooterLink;
use App\Models\FooterSocialLink;
use App\Models\PaymentMethodLogo;
use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class FooterService
{
    public const CACHE_KEY = 'footer:assembled:v2';

    public static function defaultSettings(): array
    {
        return [
            'newsletter_title' => 'Nouveau sur notre boutique ?',
            'newsletter_text' => 'Abonnez-vous à notre newsletter pour recevoir des mises à jour sur nos dernières offres. Vous pouvez vous désabonner à tout moment, comme décrit dans la ',
            'newsletter_legal_intro' => "Pour vous abonner à notre newsletter, vous devez d'abord lire et accepter les conditions légales",
            'newsletter_legal_link_label' => "J'accepte les conditions légales",
            'newsletter_legal_url' => '/cgu',
            'newsletter_privacy_label' => "J'accepte la Politique de confidentialité et des cookies et je comprends que je peux me désabonner des newsletters à tout moment.",
            'newsletter_privacy_url' => '/politique-confidentialite',
            'newsletter_privacy_link_label' => 'Politique de confidentialité',
            'newsletter_disclaimer' => 'Vous pouvez vous désabonner à tout moment comme décrit dans la ',
            'newsletter_cta' => "S'abonner",
            'show_newsletter' => true,
            'app_block_title' => 'DK HOMETECH dans votre poche !',
            'app_block_subtitle' => 'Téléchargez notre application gratuite',
            'app_store_url' => null,
            'google_play_url' => null,
            'company_name' => '',
            'company_address' => '',
            'company_phones' => '',
            'copyright_text' => 'Tous droits réservés.',
            'contact_heading' => 'Contactez-nous',
            'socials_heading' => 'Retrouvez-nous sur',
            'payments_heading' => 'Modes de paiement',
            'brands_heading' => 'Nos marques',
            'payments_empty_text' => 'Wave, Orange Money, cash…',
            'brands_only_featured' => false,
            'show_brands' => true,
            'columns_count' => 4,
            // Thème Jumia (surchargeable en admin ; null = variable CSS héritée / défaut)
            'theme' => self::defaultTheme(),
        ];
    }

    /** Palette par défaut inspirée Jumia (contraste WCAG AA sur fond sombre). */
    public static function defaultTheme(): array
    {
        return [
            'bg_primary' => '#232323',
            'bg_secondary' => '#3d3d3d',
            'text_primary' => '#ffffff',
            'text_secondary' => '#c9c9c9',
            'text_muted' => '#9a9a9a',
            'accent' => '#f68b1e',
            'link_hover' => '#ffffff',
            'divider' => 'rgba(255,255,255,0.1)',
        ];
    }

    public function settings(): array
    {
        $stored = Setting::query()->where('key', 'footer')->value('value');
        $value = is_array($stored) ? $stored : [];

        return array_replace_recursive(self::defaultSettings(), $value);
    }

    public function updateSettings(array $payload): array
    {
        $merged = array_replace_recursive($this->settings(), $payload);
        Setting::query()->updateOrCreate(['key' => 'footer'], ['value' => $merged]);
        $this->forgetCache();

        return $this->settings();
    }

    public function forgetCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    public function assemble(): array
    {
        return Cache::remember(self::CACHE_KEY, 600, function () {
            $settings = $this->settings();
            $contact = Setting::query()->where('key', 'contact')->value('value');
            $contact = is_array($contact) ? $contact : [];
            $brand = Setting::query()->where('key', 'brand')->value('value');
            $brand = is_array($brand) ? $brand : [];

            $companyName = $settings['company_name'] ?: ($brand['name'] ?? 'DK HOMETECH');
            $companyAddress = $settings['company_address'] ?: ($contact['address'] ?? '');
            $companyPhones = $settings['company_phones']
                ?: (is_string($contact['phones'] ?? null) ? $contact['phones'] : '');

            $columns = FooterColumn::query()
                ->active()
                ->orderBy('display_order')
                ->with(['links' => fn ($q) => $q->active()->orderBy('display_order')])
                ->get()
                ->map(fn (FooterColumn $col) => [
                    'id' => $col->id,
                    'title' => $col->title,
                    'links' => $col->links->map(fn (FooterLink $l) => [
                        'id' => $l->id,
                        'label' => $l->label,
                        'url' => $l->url,
                        'opens_new_tab' => $l->opens_new_tab,
                    ])->values()->all(),
                ])
                ->values()
                ->all();

            $socials = FooterSocialLink::query()
                ->active()
                ->orderBy('display_order')
                ->get()
                ->map(fn (FooterSocialLink $s) => [
                    'id' => $s->id,
                    'platform' => $s->platform,
                    'url' => $s->url,
                ])
                ->values()
                ->all();

            // Fallback réseaux depuis settings contact/socials si table vide
            if ($socials === []) {
                $socialsSetting = Setting::query()->where('key', 'socials')->value('value');
                $socialsSetting = is_array($socialsSetting) ? $socialsSetting : [];
                foreach (['facebook', 'instagram', 'tiktok', 'youtube', 'x'] as $i => $platform) {
                    $url = $socialsSetting[$platform] ?? '';
                    if ($url) {
                        $socials[] = ['id' => 0, 'platform' => $platform, 'url' => $url];
                    }
                }
                $wa = preg_replace('/\D+/', '', (string) ($contact['whatsapp'] ?? '')) ?: '';
                if ($wa) {
                    $socials[] = ['id' => 0, 'platform' => 'whatsapp', 'url' => 'https://wa.me/'.$wa];
                }
            }

            $payments = PaymentMethodLogo::query()
                ->active()
                ->orderBy('display_order')
                ->get()
                ->map(fn (PaymentMethodLogo $p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'logo_url' => $this->publicUrl($p->logo_path),
                ])
                ->values()
                ->all();

            // Marques actives triées alphabétiquement ; filtre show_in_footer (ou featured)
            $brandsQuery = Brand::query()->active()->orderBy('name');
            if ($settings['brands_only_featured'] ?? false) {
                $brandsQuery->where('is_featured', true);
            }
            $brandsQuery->where('show_in_footer', true);

            $brands = ($settings['show_brands'] ?? true)
                ? $brandsQuery->get(['id', 'name', 'slug'])->map(fn (Brand $b) => [
                    'id' => $b->id,
                    'name' => $b->name,
                    'slug' => $b->slug,
                    'href' => '/marque/'.$b->slug,
                ])->values()->all()
                : [];

            $showApp = filled($settings['app_store_url'] ?? null) || filled($settings['google_play_url'] ?? null);
            $theme = array_replace(self::defaultTheme(), is_array($settings['theme'] ?? null) ? $settings['theme'] : []);

            // Accent partagé avec le thème global du site (--accent-primary)
            $siteTheme = Setting::query()->where('key', 'theme')->value('value');
            if (is_array($siteTheme) && filled($siteTheme['accent_primary'] ?? null)) {
                $theme['accent'] = $siteTheme['accent_primary'];
            }

            return [
                'settings' => [
                    'newsletter_title' => $settings['newsletter_title'],
                    'newsletter_text' => $settings['newsletter_text'],
                    'newsletter_legal_intro' => $settings['newsletter_legal_intro'] ?? null,
                    'newsletter_legal_link_label' => $settings['newsletter_legal_link_label'] ?? null,
                    'newsletter_legal_url' => $settings['newsletter_legal_url'] ?? null,
                    'newsletter_privacy_label' => $settings['newsletter_privacy_label'],
                    'newsletter_privacy_url' => $settings['newsletter_privacy_url'],
                    'newsletter_privacy_link_label' => $settings['newsletter_privacy_link_label'] ?? 'Politique de confidentialité',
                    'newsletter_disclaimer' => $settings['newsletter_disclaimer'] ?? null,
                    'newsletter_cta' => $settings['newsletter_cta'],
                    'show_newsletter' => (bool) ($settings['show_newsletter'] ?? true),
                    'app_block_title' => $settings['app_block_title'],
                    'app_block_subtitle' => $settings['app_block_subtitle'],
                    'app_store_url' => $settings['app_store_url'] ?: null,
                    'google_play_url' => $settings['google_play_url'] ?: null,
                    'show_app_block' => $showApp,
                    'company_name' => $companyName,
                    'company_address' => $companyAddress,
                    'company_phones' => $companyPhones,
                    'copyright_text' => $settings['copyright_text'],
                    'contact_heading' => $settings['contact_heading'] ?? 'Contactez-nous',
                    'socials_heading' => $settings['socials_heading'] ?? 'Retrouvez-nous sur',
                    'payments_heading' => $settings['payments_heading'] ?? 'Modes de paiement',
                    'brands_heading' => $settings['brands_heading'] ?? 'Nos marques',
                    'payments_empty_text' => $settings['payments_empty_text'] ?? 'Wave, Orange Money, cash…',
                    'columns_count' => max(3, min(5, (int) ($settings['columns_count'] ?? 4))),
                    'brand_name' => $brand['name'] ?? 'DK HOMETECH',
                    'logo_url' => $brand['logo_url'] ?? null,
                    'theme' => $theme,
                ],
                'columns' => $columns,
                'socials' => $socials,
                'payments' => $payments,
                'brands' => $brands,
            ];
        });
    }

    public function seedDefaults(): array
    {
        if (FooterColumn::query()->exists()) {
            return ['seeded' => false, 'message' => 'Colonnes déjà présentes'];
        }

        $defs = [
            [
                'title' => "Besoin d'aide ?",
                'links' => [
                    ['Discuter avec nous', '/contact'],
                    ["Centre d'assistance", '/services'],
                    ['Contactez-nous', '/contact'],
                ],
            ],
            [
                'title' => 'Liens utiles',
                'links' => [
                    ['Commander par téléphone', '/contact'],
                    ['Suivre ma commande', '/commande'],
                    ['Livraison & expédition', '/livraison'],
                    ['Showrooms / Points de retrait', '/showrooms'],
                    ['Politique de retour', '/retours'],
                    ['Comment commander', '/comment-commander'],
                    ['SAV / Réparation', '/services'],
                ],
            ],
            [
                'title' => 'À propos',
                'links' => [
                    ['Qui sommes-nous', '/a-propos'],
                    ['CGU', '/cgu'],
                    ['Politique de retours', '/retours'],
                    ['Informations de paiement', '/paiement'],
                    ['Politique de confidentialité', '/politique-confidentialite'],
                    ['Politique de cookies', '/cookies'],
                    ['Nos showrooms', '/showrooms'],
                    ['Promotions en cours', '/promotions'],
                ],
            ],
            [
                'title' => 'Compte client',
                'links' => [
                    ['Mon compte', '/compte'],
                    ['Mes commandes', '/compte'],
                    ['Panier', '/panier'],
                    ['Favoris', '/compte'],
                ],
            ],
        ];

        foreach ($defs as $i => $col) {
            $column = FooterColumn::query()->create([
                'title' => $col['title'],
                'display_order' => ($i + 1) * 10,
                'is_active' => true,
            ]);
            foreach ($col['links'] as $j => [$label, $url]) {
                FooterLink::query()->create([
                    'footer_column_id' => $column->id,
                    'label' => $label,
                    'url' => $url,
                    'display_order' => ($j + 1) * 10,
                    'is_active' => true,
                    'opens_new_tab' => false,
                ]);
            }
        }

        $contact = Setting::query()->where('key', 'contact')->value('value');
        $contact = is_array($contact) ? $contact : [];
        $socialsSetting = Setting::query()->where('key', 'socials')->value('value');
        $socialsSetting = is_array($socialsSetting) ? $socialsSetting : [];

        $order = 10;
        foreach (['facebook', 'instagram', 'tiktok', 'youtube'] as $platform) {
            $url = $socialsSetting[$platform] ?? '';
            if ($url) {
                FooterSocialLink::query()->updateOrCreate(
                    ['platform' => $platform],
                    ['url' => $url, 'is_active' => true, 'display_order' => $order]
                );
                $order += 10;
            }
        }
        $wa = preg_replace('/\D+/', '', (string) ($contact['whatsapp'] ?? '')) ?: '';
        if ($wa) {
            FooterSocialLink::query()->updateOrCreate(
                ['platform' => 'whatsapp'],
                ['url' => 'https://wa.me/'.$wa, 'is_active' => true, 'display_order' => $order]
            );
        }

        $this->updateSettings([
            'company_name' => Setting::query()->where('key', 'brand')->value('value')['name'] ?? 'DK HOMETECH',
            'company_address' => $contact['address'] ?? 'Dakar, Sénégal',
            'company_phones' => is_string($contact['phones'] ?? null) ? $contact['phones'] : '',
        ]);

        $this->forgetCache();

        return ['seeded' => true, 'columns' => count($defs)];
    }

    protected function publicUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return Storage::disk('public')->url($path);
    }
}
