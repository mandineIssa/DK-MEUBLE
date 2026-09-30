<?php

namespace App\Services\Ai;

class QueryInterpreter
{
    /** @var list<string> */
    private array $stop = [
        'je', 'j', 'tu', 'cherche', 'chercher', 'veux', 'voudrais', 'souhaiterais', 'souhaite',
        'un', 'une', 'des', 'de', 'du', 'la', 'le', 'les', 'pour', 'avec', 'mon', 'ma', 'mes',
        'moins', 'plus', 'fcfa', 'francs', 'franc', 'cfa', 'budget', 'prix', 'maximum', 'max',
        'dans', 'sur', 'au', 'aux', 'et', 'ou', 'qui', 'que', 'quoi', 'bonjour', 'salut',
        'svp', 'merci', 'avoir', 'est', 'sont', 'très', 'tres', 'peu', 'chez', 'vos', 'votre',
    ];

    /**
     * @param  list<array{id:int,name:string,slug:string}>  $categories
     * @return array{keywords:list<string>,category:string|null,category_id:int|null,max_price:int|null,min_price:int|null,multi:bool}
     */
    public function parse(string $text, array $categories = []): array
    {
        $raw = trim($text);
        $folded = $this->fold($raw);
        $max = $this->amount($folded, '/(?:moins de|maximum|max|jusqu|budget(?: de| max)?)[^0-9]{0,12}([0-9][0-9\s.]{2,})/u');
        $min = $this->amount($folded, '/(?:plus de|minimum|min|a partir de|à partir de)[^0-9]{0,12}([0-9][0-9\s.]{2,})/u');
        if ($max === null) {
            $max = $this->amount($folded, '/([0-9][0-9\s.]{3,})\s*(?:fcfa|francs|cfa)/u');
        }
        if ($max === null) {
            $max = $this->amount($folded, '/(?:j ai|avec|dispose de)[^0-9]{0,16}([0-9][0-9\s.]{2,})/u');
        }
        if ($max === null && preg_match('/([0-9]+(?:[.,][0-9]+)?)\s*millions?/u', $folded, $million)) {
            $value = (float) str_replace(',', '.', $million[1]);
            if ($value >= 1 && $value <= 500) {
                $max = (int) round($value * 1000000);
            }
        }
        $bundle = (bool) preg_match('/equip|maison|salon|chambre|appartement|bureau/u', $folded);
        if ($max === null && $bundle) {
            $max = $this->largestAmount($folded);
        }

        $category = null;
        $categoryId = null;
        $best = 0;
        foreach ($categories as $row) {
            $name = $this->fold((string) ($row['name'] ?? ''));
            if ($name === '' || ! str_contains($folded, $name)) {
                continue;
            }
            $len = mb_strlen($name);
            if ($len > $best) {
                $best = $len;
                $category = (string) $row['slug'];
                $categoryId = (int) $row['id'];
            }
        }

        $keywords = [];
        foreach (preg_split('/[^\p{L}\p{N}]+/u', $folded) ?: [] as $token) {
            $token = trim((string) $token);
            if (mb_strlen($token) < 3 || in_array($token, $this->stop, true) || ctype_digit($token)) {
                continue;
            }
            if ($categoryId && $category) {
                $catName = '';
                foreach ($categories as $row) {
                    if ((int) $row['id'] === $categoryId) {
                        $catName = $this->fold((string) $row['name']);
                    }
                }
                if ($catName !== '' && str_contains(' '.$catName.' ', ' '.$token.' ')) {
                    continue;
                }
            }
            $keywords[] = $token;
        }
        $keywords = array_values(array_unique($keywords));

        $multi = $bundle || (bool) preg_match('/plusieurs|ensemble/u', $folded);

        return [
            'keywords' => array_slice($keywords, 0, 8),
            'category' => $category,
            'category_id' => $categoryId,
            'max_price' => $max,
            'min_price' => $min,
            'multi' => $multi && $max !== null,
        ];
    }

    private function fold(string $value): string
    {
        $value = mb_strtolower($value);
        $value = str_replace(["'", '’', '`'], ' ', $value);

        return strtr($value, ['é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e', 'à' => 'a', 'â' => 'a', 'ù' => 'u', 'û' => 'u', 'ô' => 'o', 'î' => 'i', 'ï' => 'i', 'ç' => 'c']);
    }

    private function amount(string $text, string $pattern): ?int
    {
        if (! preg_match($pattern, $text, $m)) {
            return null;
        }
        $digits = preg_replace('/\D+/', '', $m[1] ?? '');
        if ($digits === '' || (int) $digits < 1000) {
            return null;
        }

        return (int) $digits;
    }

    private function largestAmount(string $text): ?int
    {
        if (! preg_match_all('/[0-9][0-9\s.]{3,}/u', $text, $matches)) {
            return null;
        }
        $best = 0;
        foreach ($matches[0] as $chunk) {
            $digits = preg_replace('/\D+/', '', $chunk);
            $value = (int) $digits;
            if ($value >= 10000 && $value > $best) {
                $best = $value;
            }
        }

        return $best >= 10000 ? $best : null;
    }
}
