<?php

namespace Database\Seeders;

use App\Models\PageBlock;
use App\Models\Realization;
use App\Models\Setting;
use App\Services\SiteContentService;
use Illuminate\Database\Seeder;

class SiteContentSeeder extends Seeder
{
    public function run(): void
    {
        foreach (SiteContentService::defaultSettings() as $key => $value) {
            Setting::query()->updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        foreach (SiteContentService::defaultPages() as $pageKey => $blocks) {
            $sort = 0;
            foreach ($blocks as $blockKey => $content) {
                PageBlock::query()->updateOrCreate(
                    ['page_key' => $pageKey, 'block_key' => $blockKey],
                    ['content' => $content, 'sort_order' => $sort++]
                );
            }
        }

        $realizations = [
            [
                'title' => 'Équipement de bureaux — Entreprise à Dakar',
                'description' => 'Fourniture de bureaux, armoires de rangement et mobilier pour 20 postes de travail.',
                'image_url' => 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
                'tag' => 'Entreprise',
                'sort_order' => 1,
            ],
            [
                'title' => "Aménagement d'un hôtel",
                'description' => "Livraison d'électroménager complet pour les chambres et les espaces communs.",
                'image_url' => 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80',
                'tag' => 'Hôtellerie',
                'sort_order' => 2,
            ],
            [
                'title' => 'Armoires sur mesure — Résidence privée',
                'description' => "Conception et fabrication d'armoires adaptées aux dimensions des chambres.",
                'image_url' => 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1200&q=80',
                'tag' => 'Sur mesure',
                'sort_order' => 3,
            ],
            [
                'title' => 'Salon contemporain — Maison familiale',
                'description' => 'Sélection et livraison de canapés, tables et rangements pour un salon complet.',
                'image_url' => 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80',
                'tag' => 'Maison',
                'sort_order' => 4,
            ],
            [
                'title' => 'Cuisine équipée — Appartement neuf',
                'description' => "Électroménager encastrable et mobilier de cuisine pour un appartement à Dakar.",
                'image_url' => 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1200&q=80',
                'tag' => 'Électroménager',
                'sort_order' => 5,
            ],
            [
                'title' => 'Salle de réunion — Siège social',
                'description' => 'Tables de réunion, chaises et rangements pour un espace professionnel moderne.',
                'image_url' => 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80',
                'tag' => 'Bureau',
                'sort_order' => 6,
            ],
        ];

        foreach ($realizations as $item) {
            Realization::query()->updateOrCreate(
                ['title' => $item['title']],
                array_merge($item, ['status' => 'published'])
            );
        }
    }
}
