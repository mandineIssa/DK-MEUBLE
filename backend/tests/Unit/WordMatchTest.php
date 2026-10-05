<?php

namespace Tests\Unit;

use App\Services\Ai\VisualTerms;
use App\Services\Ai\WordMatch;
use PHPUnit\Framework\TestCase;

class WordMatchTest extends TestCase
{
    public function test_any_catalog_word_matches_inside_a_longer_name(): void
    {
        $cases = [
            'table' => 'Table basse de bureau',
            'chaise' => 'Chaise visiteur maille noire',
            'lit' => 'Lit coffre 160',
            'canape' => 'Canapé d’angle Premium',
            'bureau' => 'Bureaux de direction',
            'armoire' => 'Armoire chambre à coucher',
            'matelas' => 'Matelas mémoire de forme',
            'fauteuil' => 'Fauteuil de direction',
            'refrigerateur' => 'Réfrigérateurs Standard',
            'televiseur' => 'Téléviseur 55 pouces',
        ];

        foreach ($cases as $word => $name) {
            $this->assertTrue(WordMatch::contains($name, $word), $word.' dans '.$name);
        }
    }

    public function test_a_word_does_not_match_when_it_is_only_part_of_another_word(): void
    {
        $this->assertFalse(WordMatch::contains('Salon confortable', 'table'));
        $this->assertFalse(WordMatch::contains('Tablette Android', 'table'));
        $this->assertFalse(WordMatch::contains('Qualité premium', 'lit'));
        $this->assertFalse(WordMatch::contains('Chaiselongue', 'chaise'));
    }

    public function test_photo_labels_become_catalog_words_and_filenames_do_not(): void
    {
        $terms = new VisualTerms;

        $this->assertSame(['chaise'], $terms->toCatalogWords(['Chair', 'furniture', 'indoor']));
        $this->assertSame(['canape'], $terms->toCatalogWords(['couch']));
        $this->assertSame(['refrigerateur'], $terms->toCatalogWords(['refrigerator']));
        $this->assertSame(['televiseur'], $terms->toCatalogWords(['TV']));
        $this->assertSame(['table'], $terms->toCatalogWords(['coffee table']));
        $this->assertSame([], $terms->filenameWords('IMG_20260930.jpg'));
        $this->assertSame([], $terms->filenameWords('WhatsApp Image 2026-09-30.jpeg'));
        $this->assertContains('chaise', $terms->filenameWords('chaise-visiteur.png'));
    }
}
