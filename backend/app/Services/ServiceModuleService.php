<?php

namespace App\Services;

use App\Models\Service;
use App\Models\Setting;
use Illuminate\Support\Str;

class ServiceModuleService
{
    public static function defaultSettings(): array
    {
        return [
            'intro_title' => 'Nos services',
            'intro_text' => 'Installation, SAV, garantie et accompagnement autour de votre électroménager — des prestations gérées par notre équipe.',
            'request_form_enabled' => true,
            'home_featured_limit' => 4,
        ];
    }

    public function settings(): array
    {
        $stored = Setting::query()->where('key', 'services')->value('value');
        $value = is_array($stored) ? $stored : [];

        return array_replace_recursive(self::defaultSettings(), $value);
    }

    public function updateSettings(array $payload): array
    {
        $merged = array_replace_recursive($this->settings(), $payload);
        Setting::query()->updateOrCreate(
            ['key' => 'services'],
            ['value' => $merged]
        );

        return $this->settings();
    }

    public function uniqueSlug(string $title, ?string $slug = null, ?int $ignoreId = null): string
    {
        $base = Str::slug($slug ?: $title) ?: 'service';
        $candidate = $base;
        $i = 2;
        while (
            Service::query()
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->where('slug', $candidate)
                ->exists()
        ) {
            $candidate = $base.'-'.$i;
            $i++;
        }

        return $candidate;
    }

    public function ensureDefaults(): void
    {
        if (Service::query()->exists()) {
            return;
        }

        $defaults = [
            [
                'title' => 'Livraison & Installation',
                'icon' => 'delivery',
                'short_description' => 'livraison à domicile - installation - mise en service - branchement et réglages',
                'full_content' => "<p>Nous livrons et installons votre électroménager à domicile. Nos techniciens assurent le branchement, les réglages et la mise en service pour un démarrage en toute sérénité.</p><h3>Inclus</h3><ul><li>Livraison planifiée</li><li>Installation et mise en service</li><li>Conseils d'utilisation</li></ul>",
                'cta_label' => 'Demander une installation',
            ],
            [
                'title' => 'Réparation & SAV',
                'icon' => 'repair',
                'short_description' => 'diagnostic - réparation sur site ou atelier - pièces de rechange',
                'full_content' => '<p>En panne ? Notre service après-vente diagnostique et répare vos appareils, sur site ou en atelier, avec des pièces adaptées.</p>',
                'cta_label' => 'Contacter le SAV',
            ],
            [
                'title' => 'Maintenance & Entretien',
                'icon' => 'maintenance',
                'short_description' => 'entretien préventif - climatiseurs - réfrigérateurs - contrats',
                'full_content' => '<p>Prolongez la durée de vie de vos appareils avec nos contrats d’entretien préventif.</p>',
                'cta_label' => 'Demander un entretien',
            ],
            [
                'title' => 'Extension de garantie',
                'icon' => 'warranty',
                'short_description' => 'garantie additionnelle - au-delà du constructeur - sérénité',
                'full_content' => '<p>Protégez votre investissement avec une extension de garantie au-delà de la couverture constructeur.</p>',
                'cta_label' => 'En savoir plus',
            ],
            [
                'title' => 'Reprise de l\'ancien appareil',
                'icon' => 'tradein',
                'short_description' => 'reprise - recyclage - à l\'achat d\'un neuf',
                'full_content' => '<p>À l’achat d’un appareil neuf, nous pouvons reprendre et recycler votre ancien électroménager.</p>',
                'cta_label' => 'Demander une reprise',
            ],
            [
                'title' => 'Financement / Paiement échelonné',
                'icon' => 'finance',
                'short_description' => 'facilités de paiement - partenariats - échéancier',
                'full_content' => '<p>Facilitez votre achat grâce à nos solutions de paiement échelonné et partenariats.</p>',
                'cta_label' => 'Demander un devis',
            ],
            [
                'title' => 'Support technique / Hotline',
                'icon' => 'support',
                'short_description' => 'assistance téléphone - WhatsApp - dépannage rapide',
                'full_content' => '<p>Une question technique ? Notre hotline vous répond rapidement par téléphone ou WhatsApp.</p>',
                'cta_label' => 'Nous contacter',
                'cta_link' => '/contact',
            ],
        ];

        foreach ($defaults as $i => $row) {
            Service::create([
                'title' => $row['title'],
                'slug' => $this->uniqueSlug($row['title']),
                'icon' => $row['icon'],
                'short_description' => $row['short_description'],
                'full_content' => $row['full_content'],
                'display_order' => ($i + 1) * 10,
                'is_active' => true,
                'is_featured' => $i < 4,
                'cta_label' => $row['cta_label'],
                'cta_link' => $row['cta_link'] ?? null,
            ]);
        }
    }
}
