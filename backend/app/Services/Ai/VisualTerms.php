<?php

namespace App\Services\Ai;

/** Traduit les mots d'une photo (souvent en anglais) vers des mots du catalogue. */
class VisualTerms
{
    /** @var array<string, string> */
    private const MAP = [
        'table' => 'table',
        'desk' => 'bureau',
        'chair' => 'chaise',
        'stool' => 'tabouret',
        'sofa' => 'canape',
        'couch' => 'canape',
        'settee' => 'canape',
        'bed' => 'lit',
        'mattress' => 'matelas',
        'wardrobe' => 'armoire',
        'closet' => 'armoire',
        'cupboard' => 'armoire',
        'cabinet' => 'armoire',
        'refrigerator' => 'refrigerateur',
        'fridge' => 'refrigerateur',
        'freezer' => 'congelateur',
        'television' => 'televiseur',
        'tv' => 'televiseur',
        'monitor' => 'televiseur',
        'fan' => 'ventilateur',
        'oven' => 'four',
        'microwave' => 'microonde',
        'washer' => 'lave',
        'stove' => 'cuisiniere',
        'cooker' => 'cuisiniere',
        'shelf' => 'etagere',
        'shelving' => 'etagere',
        'armchair' => 'fauteuil',
        'nightstand' => 'chevet',
        'mirror' => 'miroir',
        'lamp' => 'lampe',
        'carpet' => 'tapis',
        'rug' => 'tapis',
        'curtain' => 'rideau',
        'bench' => 'banc',
        'bookshelf' => 'bibliotheque',
        'sideboard' => 'buffet',
        'speaker' => 'enceinte',
        'blender' => 'mixeur',
        'coffee table' => 'table',
        'dining table' => 'table',
        'air conditioner' => 'climatiseur',
        'washing machine' => 'lave',
    ];

    /** @var array<string, true> */
    private const STOP = [
        'furniture' => true, 'indoor' => true, 'outdoor' => true, 'product' => true,
        'white' => true, 'black' => true, 'brown' => true, 'red' => true, 'blue' => true,
        'green' => true, 'gray' => true, 'grey' => true, 'room' => true, 'home' => true,
        'house' => true, 'wood' => true, 'wooden' => true, 'plastic' => true, 'metal' => true,
        'floor' => true, 'wall' => true, 'design' => true, 'modern' => true, 'luxury' => true,
        'sitting' => true, 'person' => true, 'people' => true, 'man' => true, 'woman' => true,
        'hand' => true, 'background' => true, 'interior' => true, 'exterior' => true,
        'object' => true, 'item' => true, 'photo' => true, 'image' => true, 'picture' => true,
        'screenshot' => true, 'whatsapp' => true, 'camera' => true, 'dsc' => true, 'img' => true,
        'jpeg' => true, 'jpg' => true, 'png' => true, 'webp' => true, 'adjusted' => true,
        'color' => true, 'colour' => true, 'style' => true, 'decor' => true, 'decoration' => true,
        'living' => true, 'bedroom' => true, 'kitchen' => true, 'blanc' => true, 'noir' => true,
        'gris' => true, 'moderne' => true, 'interieur' => true, 'exterieur' => true,
        'meuble' => true, 'meubles' => true, 'appareil' => true, 'produit' => true,
        'aucun' => true, 'none' => true,
    ];

    /**
     * @param list<string> $labels
     * @return list<string>
     */
    public function toCatalogWords(array $labels): array
    {
        $words = [];
        foreach ($labels as $label) {
            $folded = trim(WordMatch::fold((string) $label));
            if ($folded === '') {
                continue;
            }
            if (isset(self::MAP[$folded])) {
                $words[] = self::MAP[$folded];
                continue;
            }
            foreach (preg_split('/[^\p{L}\p{N}]+/u', $folded) ?: [] as $token) {
                $token = trim((string) $token);
                if ($token === '' || isset(self::STOP[$token]) || ctype_digit($token)) {
                    continue;
                }
                if (isset(self::MAP[$token])) {
                    $words[] = self::MAP[$token];
                    continue;
                }
                if (mb_strlen($token) < 3) {
                    continue;
                }
                $words[] = $token;
            }
        }

        return array_slice(array_values(array_unique($words)), 0, 4);
    }

    /** @return list<string> */
    public function filenameWords(string $filename): array
    {
        $base = pathinfo($filename, PATHINFO_FILENAME);

        return $this->toCatalogWords([$base]);
    }
}
