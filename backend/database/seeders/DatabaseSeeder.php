<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => env('ADMIN_EMAIL', 'admin@dkmeuble.sn')],
            [
                'name' => 'Admin DK MEUBLE',
                'password' => Hash::make(env('ADMIN_PASSWORD', 'password')),
            ]
        );

        $electromenager = Category::query()->updateOrCreate(
            ['slug' => 'electromenager'],
            ['name' => 'Électroménager']
        );
        $meubles = Category::query()->updateOrCreate(
            ['slug' => 'meubles'],
            ['name' => 'Meubles & Armoires']
        );
        $bureaux = Category::query()->updateOrCreate(
            ['slug' => 'bureaux'],
            ['name' => 'Bureaux']
        );
        $tv = Category::query()->updateOrCreate(
            ['slug' => 'tv-audio'],
            ['name' => 'TV & Audio']
        );

        $products = [
            [
                'category_id' => $electromenager->id,
                'name' => 'Réfrigérateur 350L',
                'slug' => 'refrigerateur-350l',
                'description' => "Réfrigérateur double battant, grande capacité, idéal pour une famille.\nÉconomie d'énergie · Garantie 1 an.",
                'price' => 350000,
                'is_customizable' => false,
                'image' => 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=1200&q=80',
            ],
            [
                'category_id' => $electromenager->id,
                'name' => 'Machine à laver 8kg',
                'slug' => 'machine-a-laver-8kg',
                'description' => 'Lave-linge frontale 8 kg, programmes multiples, adaptée au quotidien sénégalais.',
                'price' => 275000,
                'is_customizable' => false,
                'image' => 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=1200&q=80',
            ],
            [
                'category_id' => $electromenager->id,
                'name' => 'Cuisinière 4 feux',
                'slug' => 'cuisiniere-4-feux',
                'description' => 'Cuisinière gaz 4 feux avec four, robuste et simple d’entretien.',
                'price' => 165000,
                'is_customizable' => false,
                'image' => 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1200&q=80',
            ],
            [
                'category_id' => $meubles->id,
                'name' => 'Armoire 3 portes',
                'slug' => 'armoire-3-portes',
                'description' => 'Armoire spacieuse, personnalisable selon vos dimensions et finitions.',
                'price' => null,
                'is_customizable' => true,
                'image' => 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80',
            ],
            [
                'category_id' => $meubles->id,
                'name' => 'Salon 6 places',
                'slug' => 'salon-6-places',
                'description' => 'Ensemble salon confortable pour salon familial ou réception.',
                'price' => 450000,
                'is_customizable' => true,
                'image' => 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
            ],
            [
                'category_id' => $bureaux->id,
                'name' => 'Bureau professionnel',
                'slug' => 'bureau-professionnel',
                'description' => 'Bureau robuste pour espaces de travail en entreprise.',
                'price' => 95000,
                'is_customizable' => true,
                'image' => 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1200&q=80',
            ],
            [
                'category_id' => $bureaux->id,
                'name' => 'Chaise de bureau ergonomique',
                'slug' => 'chaise-bureau-ergo',
                'description' => 'Siège réglable, idéal pour les postes de travail prolongés.',
                'price' => 65000,
                'is_customizable' => false,
                'image' => 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=1200&q=80',
            ],
            [
                'category_id' => $tv->id,
                'name' => 'Smart TV 55"',
                'slug' => 'smart-tv-55',
                'description' => 'Téléviseur 55 pouces Full HD / Smart, parfait pour salon.',
                'price' => 320000,
                'is_customizable' => false,
                'image' => 'https://images.unsplash.com/photo-1593359677995-65cb3c2c5c18?auto=format&fit=crop&w=1200&q=80',
            ],
        ];

        foreach ($products as $data) {
            $image = $data['image'];
            unset($data['image']);

            $product = Product::query()->updateOrCreate(
                ['slug' => $data['slug']],
                array_merge($data, ['status' => 'published'])
            );

            ProductImage::query()->updateOrCreate(
                ['product_id' => $product->id, 'order' => 0],
                ['path' => $image]
            );
        }

        $this->call(SiteContentSeeder::class);

        app(\App\Services\NotificationService::class)->seedTemplates();
    }
}
