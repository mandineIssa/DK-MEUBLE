<?php

namespace App\Services;

use App\Models\PageBlock;
use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

class SiteContentService
{
    public static function defaultSettings(): array
    {
        return [
            'brand' => [
                'name' => 'DK MEUBLE',
                'logo_url' => '',
            ],
            'contact' => [
                'whatsapp' => '',
                'phone_display' => '',
                'phone_tel' => '',
                'phones' => '',
                'email' => '',
                'address' => '',
                'hours' => '',
                'maps_embed' => '',
            ],
            'socials' => [
                'facebook' => '',
                'instagram' => '',
                'tiktok' => '',
                'youtube' => '',
            ],
            'footer' => [
                'trust' => [
                    'Qualité',
                    'Livraison partout au Sénégal',
                    'Service de confiance',
                ],
            ],
            'seo' => [
                'title' => 'DK MEUBLE — Meubles & Électroménager à Dakar',
                'description' => 'Meubles, armoires et électroménager à Dakar. Livraison partout au Sénégal. +10 ans d’expérience.',
            ],
            'legal' => [
                'cgv' => '',
                'mentions' => '',
            ],
            'contacts_services' => [
                'commercial' => '',
                'recrutement' => '',
                'reclamations' => '',
            ],
            'payment_logos' => [],
            'homepage' => [
                'nav_secondary' => [
                    ['label' => 'Nos produits', 'href' => '/produits', 'enabled' => true, 'order' => 0],
                    ['label' => 'Promotion', 'href' => '/promo', 'enabled' => true, 'order' => 1],
                    ['label' => 'Reconditionné', 'href' => '/reconditionne', 'enabled' => true, 'order' => 2],
                    ['label' => 'Destockage', 'href' => '/destockage', 'enabled' => true, 'order' => 3],
                    ['label' => 'Services', 'href' => '/services', 'enabled' => true, 'order' => 4],
                    ['label' => 'Contact', 'href' => '/contact', 'enabled' => true, 'order' => 5],
                ],
                'newsletter' => [
                    'enabled' => true,
                    'title' => 'Newsletter',
                    'subtitle' => 'Recevez nos offres et nouveautés',
                    'cta_label' => "S'inscrire",
                    'provider' => 'internal',
                ],
                'whatsapp_widget' => [
                    'enabled' => true,
                    'phone' => '',
                    'message' => 'Bonjour, je souhaite des informations sur vos produits.',
                    'agent_image' => '',
                ],
                'footer_about' => 'DK MEUBLE — Meubles & électroménager à Dakar. Qualité, conseil et livraison partout au Sénégal.',
                'footer_info_links' => [
                    ['label' => 'À propos', 'href' => '/a-propos', 'enabled' => true],
                    ['label' => 'Contact', 'href' => '/contact', 'enabled' => true],
                    ['label' => 'Tous les produits', 'href' => '/produits', 'enabled' => true],
                    ['label' => 'Politique de confidentialité', 'href' => '/legal', 'enabled' => true],
                    ['label' => 'Showrooms', 'href' => '/showrooms', 'enabled' => true],
                ],
                'agency_credit' => '',
            ],
        ];
    }

    public static function allSettingsStatic(): array
    {
        return app(self::class)->allSettings();
    }

    public static function defaultPages(): array
    {
        return [
            'home' => [
                'hero' => [
                    'title_line1' => 'Meubles &',
                    'title_line2' => 'Électroménager',
                    'subtitle' => 'Maison • Bureau • Entreprise',
                    'image_url' => 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=2000&q=80',
                    'badge_text' => "+10 ans\nd'expérience",
                    'chat_prompt' => 'Une question ? Écrivez-nous',
                    'cta_primary_label' => 'Voir les produits',
                    'cta_primary_href' => '/produits',
                    'cta_secondary_label' => 'Demander un devis',
                    'cta_secondary_href' => '/devis',
                ],
                'category_tiles' => [
                    [
                        'title' => 'Électroménager',
                        'category_slug' => 'electromenager',
                        'image_url' => 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1200&q=80',
                    ],
                    [
                        'title' => 'Meubles & Armoires',
                        'category_slug' => 'meubles',
                        'image_url' => 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
                    ],
                ],
                'products_section' => [
                    'title' => 'Nos produits',
                    'cta_label' => 'Voir tout le catalogue',
                    'cta_href' => '/produits',
                ],
            ],
            'about' => [
                'hero' => [
                    'eyebrow' => 'À propos de DK MEUBLE',
                    'title' => 'Bienvenue chez DK MEUBLE',
                    'subtitle' => 'Meublez. Équipez. Faites confiance.',
                ],
                'intro' => [
                    'image_url' => 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
                    'paragraphs' => [
                        "Depuis plus de 10 ans, DK MEUBLE accompagne les particuliers, les entreprises et les institutions dans l'aménagement et l'équipement de leurs espaces.",
                        'Basée à Dakar, notre entreprise propose une large gamme de meubles, armoires, mobilier de bureau et électroménager pour répondre aux besoins de chaque client.',
                        'Notre priorité est simple : vous proposer de bons produits, au meilleur rapport qualité-prix, avec un service sérieux et de proximité.',
                    ],
                ],
                'experience' => [
                    'title' => "Plus de 10 ans d'expérience",
                    'paragraphs' => [
                        'Notre expérience nous permet de mieux comprendre les besoins de nos clients et de leur proposer des solutions adaptées.',
                        'Que vous souhaitiez équiper une maison, un appartement, un bureau, une entreprise ou une institution, notre équipe est là pour vous accompagner.',
                    ],
                ],
                'home_section' => [
                    'title' => 'Pour votre maison',
                    'intro' => "Donnez à votre maison le confort et le style qu'elle mérite.",
                    'list_label' => 'Découvrez nos solutions pour votre intérieur :',
                    'items' => [
                        'Salons et meubles',
                        'Armoires et rangements',
                        'Réfrigérateurs',
                        'Machines à laver',
                        'Équipements électroménagers',
                        'Et bien plus encore',
                    ],
                    'footer_note' => 'Un besoin particulier ? Contactez-nous et nous vous conseillerons.',
                ],
                'business_section' => [
                    'title' => 'Pour votre entreprise',
                    'intro' => "DK MEUBLE accompagne également les entreprises, bureaux et institutions dans leurs projets d'équipement.",
                    'list_label' => 'Nous pouvons vous accompagner pour :',
                    'items' => [
                        'Mobilier de bureau',
                        'Armoires de rangement',
                        'Bureaux et espaces de travail',
                        'Aménagement de locaux',
                        'Commandes en quantité',
                        'Demandes de devis professionnels',
                    ],
                    'cta_label' => 'Demander un devis',
                    'cta_href' => '/devis',
                ],
                'delivery' => [
                    'title' => 'Livraison partout au Sénégal',
                    'text' => 'Vous êtes à Dakar ou dans une autre région du Sénégal ? DK MEUBLE livre ses produits partout au Sénégal.',
                    'highlight' => 'Vous choisissez → nous vous accompagnons → nous livrons.',
                ],
                'values' => [
                    'title' => 'Nos valeurs',
                    'items' => [
                        ['title' => 'Qualité', 'text' => 'Nous sélectionnons des produits répondant aux besoins de nos clients.'],
                        ['title' => 'Prix', 'text' => 'Nous recherchons un bon rapport qualité / prix pour nos clients.'],
                        ['title' => 'Confiance', 'text' => 'Nous construisons une relation durable avec nos clients.'],
                        ['title' => 'Service', 'text' => "Nous vous accompagnons de votre demande jusqu'à la livraison."],
                    ],
                ],
                'reasons' => [
                    'title' => 'Pourquoi choisir DK MEUBLE ?',
                    'items' => [
                        ['value' => '+10 ans', 'label' => "d'expérience"],
                        ['value' => 'Tous', 'label' => 'particuliers & entreprises'],
                        ['value' => 'Sénégal', 'label' => 'livraison partout au pays'],
                        ['value' => 'WhatsApp', 'label' => 'contact rapide et simple'],
                        ['value' => 'Devis', 'label' => 'projets et commandes'],
                    ],
                ],
                'cta' => [
                    'title' => "Besoin d'un produit ?",
                    'text' => "Vous cherchez un meuble, une armoire ou un appareil électroménager ? Pas besoin de vous déplacer : envoyez-nous un message sur WhatsApp ou appelez-nous.",
                    'tagline' => 'DK MEUBLE — Qualité · Choix · Confiance',
                    'partner_line' => 'Votre partenaire pour la maison et le bureau.',
                ],
            ],
            'contact' => [
                'hero' => [
                    'eyebrow' => 'Contact',
                    'title' => 'Parlons de votre projet',
                    'subtitle' => '',
                ],
            ],
            'devis' => [
                'hero' => [
                    'eyebrow' => 'Devis',
                    'title' => 'Demande de devis',
                    'subtitle' => 'Particulier ou entreprise : décrivez votre besoin et nous vous recontactons avec une proposition adaptée.',
                ],
            ],
            'realizations' => [
                'hero' => [
                    'eyebrow' => 'Portfolio',
                    'title' => 'Nos réalisations',
                    'subtitle' => "Depuis plus de 10 ans, DK MEUBLE accompagne particuliers, entreprises et institutions dans leurs projets d'aménagement.",
                ],
                'cta' => [
                    'title' => 'Un projet à réaliser ?',
                    'text' => 'Parlez-nous de vos besoins — nous vous répondons rapidement.',
                ],
            ],
            'privacy' => [
                'hero' => [
                    'eyebrow' => 'Légal',
                    'title' => 'Politique de confidentialité',
                    'subtitle' => 'Comment DK MEUBLE collecte, utilise et protège vos données personnelles.',
                ],
                'intro' => 'DK MEUBLE s’engage à protéger vos données personnelles. Cette page décrit quelles informations nous collectons, pourquoi, et quels sont vos droits.',
                'sections' => [
                    [
                        'title' => 'Données collectées',
                        'body' => 'Selon votre usage du site, nous pouvons collecter : nom, e-mail, téléphone, adresse de livraison, historique de commandes, préférences (newsletter, favoris) et données techniques de navigation (cookies).',
                    ],
                    [
                        'title' => 'Finalités',
                        'body' => "• Traiter vos commandes, devis et demandes de contact\n• Vous envoyer la newsletter si vous y avez consenti\n• Améliorer le site et la sécurité (statistiques anonymisées)",
                    ],
                    [
                        'title' => 'Newsletter',
                        'body' => 'L’inscription à la newsletter est volontaire. Vous pouvez vous désabonner à tout moment via le lien présent dans chaque e-mail, ou en nous contactant.',
                    ],
                    [
                        'title' => 'Vos droits',
                        'body' => 'Vous pouvez demander l’accès, la rectification ou la suppression de vos données via notre page contact.',
                    ],
                ],
                'updated_label' => 'Dernière mise à jour : septembre 2026',
            ],
            'cgu' => [
                'hero' => [
                    'eyebrow' => 'Légal',
                    'title' => 'Conditions générales d’utilisation',
                    'subtitle' => 'Conditions d’utilisation du site DK MEUBLE.',
                ],
                'intro' => 'En accédant au site DK MEUBLE, vous acceptez les présentes conditions. Elles régissent l’utilisation du catalogue, des devis, des commandes et des services associés.',
                'sections' => [
                    [
                        'title' => 'Objet',
                        'body' => 'Le site présente des produits électroménagers et de mobilier, permet de demander un devis, de commander et de contacter notre équipe.',
                    ],
                    [
                        'title' => 'Compte & commandes',
                        'body' => 'Vous êtes responsable des informations fournies. Les prix et disponibilités peuvent évoluer ; une confirmation vous est envoyée après validation.',
                    ],
                    [
                        'title' => 'Données personnelles',
                        'body' => 'Le traitement de vos données est décrit dans notre Politique de confidentialité.',
                    ],
                    [
                        'title' => 'Contact',
                        'body' => 'Pour toute question, utilisez la page contact du site.',
                    ],
                ],
                'updated_label' => 'Dernière mise à jour : septembre 2026',
            ],
        ];
    }

    public function allSettings(): array
    {
        return Cache::remember('site:settings:v1', 120, function () {
            return $this->buildAllSettings();
        });
    }

    public function forgetSettingsCache(): void
    {
        Cache::forget('site:settings:v1');
    }

    protected function buildAllSettings(): array
    {
        $defaults = self::defaultSettings();
        $stored = Setting::query()->pluck('value', 'key')->all();

        $out = [];
        foreach ($defaults as $key => $default) {
            $value = $stored[$key] ?? $default;
            $out[$key] = is_array($default) && is_array($value)
                ? array_replace_recursive($default, $value)
                : $value;
        }

        foreach ($stored as $key => $value) {
            if (! array_key_exists($key, $out)) {
                $out[$key] = $value;
            }
        }

        if (isset($out['contact']) && is_array($out['contact'])) {
            foreach ($out['contact'] as $k => $v) {
                if ($v === null) {
                    $out['contact'][$k] = '';
                }
            }
        }

        if (isset($out['brand']) && is_array($out['brand'])) {
            foreach ($out['brand'] as $k => $v) {
                if ($v === null) {
                    $out['brand'][$k] = '';
                }
            }
        }

        return $out;
    }

    public function updateSettings(array $payload): array
    {
        $current = $this->buildAllSettings();

        if (isset($payload['contact']) && is_array($payload['contact'])) {
            foreach ($payload['contact'] as $k => $v) {
                if ($v === null) {
                    $payload['contact'][$k] = '';
                }
            }
        }

        if (isset($payload['brand']) && is_array($payload['brand'])) {
            foreach ($payload['brand'] as $k => $v) {
                if ($v === null) {
                    $payload['brand'][$k] = '';
                }
            }
        }

        foreach ($payload as $key => $value) {
            if (is_array($value) && isset($current[$key]) && is_array($current[$key])) {
                $value = array_replace_recursive($current[$key], $value);
            }

            Setting::query()->updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        $this->forgetSettingsCache();

        return $this->allSettings();
    }

    public function pageBlocks(string $pageKey): array
    {
        $defaults = self::defaultPages()[$pageKey] ?? [];
        $blocks = PageBlock::query()
            ->where('page_key', $pageKey)
            ->orderBy('sort_order')
            ->get();

        $out = $defaults;
        foreach ($blocks as $block) {
            $content = $block->content ?? [];
            $isList = is_array($content) && array_is_list($content);
            if (
                ! $isList
                && isset($defaults[$block->block_key])
                && is_array($defaults[$block->block_key])
                && is_array($content)
            ) {
                $out[$block->block_key] = array_replace_recursive($defaults[$block->block_key], $content);
            } else {
                $out[$block->block_key] = $content;
            }
        }

        return [
            'page_key' => $pageKey,
            'blocks' => $out,
        ];
    }

    public function updatePageBlocks(string $pageKey, array $blocks): array
    {
        $sort = 0;
        foreach ($blocks as $blockKey => $content) {
            PageBlock::query()->updateOrCreate(
                ['page_key' => $pageKey, 'block_key' => $blockKey],
                ['content' => $content, 'sort_order' => $sort++]
            );
        }

        return $this->pageBlocks($pageKey);
    }
}
