<?php

namespace App\Services\Ai;

/** Correspondance d'un mot entier, pour n'importe quel terme du catalogue. */
class WordMatch
{
    public static function fold(string $value): string
    {
        $value = mb_strtolower($value);
        $value = str_replace(["'", '’', '`'], ' ', $value);

        return strtr($value, [
            'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
            'à' => 'a', 'â' => 'a', 'ä' => 'a',
            'ù' => 'u', 'û' => 'u', 'ü' => 'u',
            'ô' => 'o', 'ö' => 'o',
            'î' => 'i', 'ï' => 'i',
            'ç' => 'c',
        ]);
    }

    /** @return list<string> */
    public static function forms(string $word): array
    {
        $word = trim(self::fold($word));
        if ($word === '' || mb_strlen($word) < 2) {
            return [];
        }

        $forms = [$word];
        if (str_ends_with($word, 's') && mb_strlen($word) >= 4) {
            $forms[] = mb_substr($word, 0, -1);
        } elseif (! str_ends_with($word, 'x')) {
            $forms[] = $word.'s';
        }
        if (str_ends_with($word, 'au') || str_ends_with($word, 'eu')) {
            $forms[] = $word.'x';
        }
        if (str_ends_with($word, 'al') && mb_strlen($word) >= 4) {
            $forms[] = mb_substr($word, 0, -2).'aux';
        }

        return array_values(array_unique(array_filter($forms, fn (string $form) => mb_strlen($form) >= 2)));
    }

    public static function contains(string $haystack, string $word): bool
    {
        $hay = self::fold($haystack);
        foreach (self::forms($word) as $form) {
            $pattern = '/(^|[^a-z0-9])'.preg_quote($form, '/').'([^a-z0-9]|$)/';
            if (preg_match($pattern, $hay) === 1) {
                return true;
            }
        }

        return false;
    }

    /** @return list<string> */
    public static function likePatterns(string $word): array
    {
        $patterns = [];
        foreach (self::forms($word) as $form) {
            $patterns[] = $form;
            $patterns[] = $form.' %';
            $patterns[] = $form.'-%';
            $patterns[] = '% '.$form;
            $patterns[] = '% '.$form.' %';
            $patterns[] = '% '.$form.'-%';
            $patterns[] = '%-'.$form;
            $patterns[] = '%-'.$form.' %';
            $patterns[] = '%-'.$form.'-%';
        }

        return array_values(array_unique($patterns));
    }
}
