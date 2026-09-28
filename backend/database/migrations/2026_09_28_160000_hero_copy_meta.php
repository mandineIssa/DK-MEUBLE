<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $hero = DB::table('homepage_sections')->where('type', 'hero')->orderBy('display_order')->first();
        if (! $hero) {
            return;
        }

        $meta = json_decode($hero->meta ?? '[]', true);
        if (! is_array($meta)) {
            $meta = [];
        }

        $defaults = [
            'headline' => 'L’équipement de votre maison',
            'subhead' => 'Électroménager · Mobilier · Électronique',
            'body' => 'Qualité, confort et service au meilleur prix au Sénégal.',
            'primary_label' => 'Découvrir nos produits',
            'secondary_label' => 'Voir les promotions',
            'secondary_href' => '/promotions',
            'categories_label' => 'Toutes les catégories',
            'interval_seconds' => 5,
        ];

        foreach ($defaults as $key => $value) {
            if (! isset($meta[$key]) || $meta[$key] === '') {
                $meta[$key] = $value;
            }
        }

        DB::table('homepage_sections')->where('id', $hero->id)->update([
            'meta' => json_encode($meta, JSON_UNESCAPED_UNICODE),
        ]);

        Cache::forget('homepage:assembled:v1');
    }

    public function down(): void
    {
        // Les textes restent éditables en administration.
    }
};
