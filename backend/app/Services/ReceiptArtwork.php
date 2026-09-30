<?php

namespace App\Services;

/**
 * Icônes et cachet du reçu, dessinés en PNG pour un rendu fiable dans le PDF.
 */
class ReceiptArtwork
{
    private const ORANGE = [246, 139, 30];

    private const NAVY = [18, 58, 95];

    /**
     * @return array<string, string>
     */
    public static function all(): array
    {
        return [
            'mark' => self::mark(),
            'truck' => self::badge(fn ($im, $white) => self::truck($im, $white)),
            'shield' => self::badge(fn ($im, $white) => self::shield($im, $white)),
            'headset' => self::badge(fn ($im, $white) => self::headset($im, $white)),
            'pin' => self::badge(fn ($im, $white) => self::pin($im, $white)),
            'phone' => self::badge(fn ($im, $white) => self::phone($im, $white)),
            'mail' => self::badge(fn ($im, $white) => self::mail($im, $white)),
            'user' => self::badge(fn ($im, $white) => self::user($im, $white)),
            'box' => self::badge(fn ($im, $white) => self::box($im, $white)),
            'card' => self::badge(fn ($im, $white) => self::card($im, $white)),
            'stamp' => self::stamp(),
        ];
    }

    private static function mark(): string
    {
        return self::png(160, 160, function ($im): void {
            $orange = self::rgb($im, self::ORANGE);
            $white = imagecolorallocate($im, 255, 255, 255);
            self::roundRect($im, 0, 0, 160, 160, 28, $orange);
            imagefilledpolygon($im, [80, 34, 126, 72, 110, 72, 110, 122, 50, 122, 50, 72, 34, 72], $white);
            imagefilledrectangle($im, 70, 90, 90, 122, $orange);
        });
    }

    private static function stamp(): string
    {
        $font = base_path('vendor/dompdf/dompdf/lib/fonts/DejaVuSans-Bold.ttf');

        return self::png(280, 280, function ($im) use ($font): void {
            $navy = self::rgb($im, self::NAVY);
            $orange = self::rgb($im, self::ORANGE);
            imagesetthickness($im, 5);
            imageellipse($im, 140, 140, 248, 248, $navy);
            imagesetthickness($im, 2);
            imageellipse($im, 140, 140, 228, 228, $navy);
            imagefilledpolygon($im, [140, 108, 168, 132, 158, 132, 158, 162, 122, 162, 122, 132, 112, 132], $navy);
            imagefilledrectangle($im, 134, 144, 146, 162, $orange);
            self::centeredText($im, $font, 13, 'DK HOMETECH', 140, 92, $navy);
            self::centeredText($im, $font, 12, 'DAKAR', 140, 196, $navy);
        });
    }

    private static function badge(callable $draw): string
    {
        return self::png(64, 64, function ($im) use ($draw): void {
            $orange = self::rgb($im, self::ORANGE);
            $white = imagecolorallocate($im, 255, 255, 255);
            self::roundRect($im, 1, 1, 62, 62, 12, $orange);
            $draw($im, $white);
        });
    }

    private static function truck($im, int $white): void
    {
        $orange = self::rgb($im, self::ORANGE);
        imagefilledrectangle($im, 8, 26, 36, 42, $white);
        imagefilledpolygon($im, [36, 30, 52, 30, 56, 42, 36, 42], $white);
        imagefilledellipse($im, 20, 46, 10, 10, $white);
        imagefilledellipse($im, 46, 46, 10, 10, $white);
        imagefilledellipse($im, 20, 46, 4, 4, $orange);
        imagefilledellipse($im, 46, 46, 4, 4, $orange);
    }

    private static function shield($im, int $white): void
    {
        $orange = self::rgb($im, self::ORANGE);
        imagefilledpolygon($im, [32, 10, 50, 18, 48, 34, 32, 54, 16, 34, 14, 18], $white);
        imagesetthickness($im, 3);
        imageline($im, 24, 32, 30, 40, $orange);
        imageline($im, 30, 40, 42, 24, $orange);
    }

    private static function headset($im, int $white): void
    {
        imagesetthickness($im, 4);
        imagearc($im, 32, 34, 30, 26, 200, 340, $white);
        imagefilledrectangle($im, 12, 30, 20, 44, $white);
        imagefilledrectangle($im, 44, 30, 52, 44, $white);
        imagefilledrectangle($im, 30, 40, 42, 44, $white);
    }

    private static function pin($im, int $white): void
    {
        $orange = self::rgb($im, self::ORANGE);
        imagefilledellipse($im, 32, 24, 20, 20, $white);
        imagefilledpolygon($im, [32, 54, 22, 30, 42, 30], $white);
        imagefilledellipse($im, 32, 24, 8, 8, $orange);
    }

    private static function phone($im, int $white): void
    {
        $orange = self::rgb($im, self::ORANGE);
        self::roundRect($im, 22, 10, 20, 44, 4, $white);
        imagefilledrectangle($im, 26, 16, 38, 42, $orange);
    }

    private static function mail($im, int $white): void
    {
        $orange = self::rgb($im, self::ORANGE);
        imagefilledrectangle($im, 10, 18, 54, 46, $white);
        imagesetthickness($im, 2);
        imageline($im, 12, 20, 32, 34, $orange);
        imageline($im, 52, 20, 32, 34, $orange);
    }

    private static function user($im, int $white): void
    {
        imagefilledellipse($im, 32, 22, 16, 16, $white);
        imagefilledarc($im, 32, 54, 30, 26, 180, 360, $white, IMG_ARC_PIE);
    }

    private static function box($im, int $white): void
    {
        $orange = self::rgb($im, self::ORANGE);
        imagefilledrectangle($im, 12, 22, 52, 50, $white);
        imagefilledpolygon($im, [12, 22, 32, 12, 52, 22], $white);
        imagesetthickness($im, 2);
        imageline($im, 32, 12, 32, 34, $orange);
    }

    private static function card($im, int $white): void
    {
        $orange = self::rgb($im, self::ORANGE);
        self::roundRect($im, 10, 18, 44, 30, 4, $white);
        imagefilledrectangle($im, 10, 26, 54, 32, $orange);
    }

    private static function centeredText($im, string $font, int $size, string $text, int $cx, int $y, int $color): void
    {
        if (! is_file($font)) {
            return;
        }
        $box = imagettfbbox($size, 0, $font, $text);
        $width = abs($box[2] - $box[0]);
        imagettftext($im, $size, 0, (int) ($cx - $width / 2), $y, $color, $font, $text);
    }

    private static function png(int $w, int $h, callable $draw): string
    {
        $im = imagecreatetruecolor($w, $h);
        imagealphablending($im, false);
        imagesavealpha($im, true);
        $clear = imagecolorallocatealpha($im, 0, 0, 0, 127);
        imagefilledrectangle($im, 0, 0, $w, $h, $clear);
        imagealphablending($im, true);
        $draw($im);
        ob_start();
        imagepng($im);
        $binary = (string) ob_get_clean();
        imagedestroy($im);

        return 'data:image/png;base64,'.base64_encode($binary);
    }

    private static function rgb($im, array $rgb): int
    {
        return imagecolorallocate($im, $rgb[0], $rgb[1], $rgb[2]);
    }

    private static function roundRect($im, int $x, int $y, int $w, int $h, int $r, int $color): void
    {
        imagefilledrectangle($im, $x + $r, $y, $x + $w - $r - 1, $y + $h - 1, $color);
        imagefilledrectangle($im, $x, $y + $r, $x + $w - 1, $y + $h - $r - 1, $color);
        imagefilledellipse($im, $x + $r, $y + $r, $r * 2, $r * 2, $color);
        imagefilledellipse($im, $x + $w - $r - 1, $y + $r, $r * 2, $r * 2, $color);
        imagefilledellipse($im, $x + $r, $y + $h - $r - 1, $r * 2, $r * 2, $color);
        imagefilledellipse($im, $x + $w - $r - 1, $y + $h - $r - 1, $r * 2, $r * 2, $color);
    }
}
