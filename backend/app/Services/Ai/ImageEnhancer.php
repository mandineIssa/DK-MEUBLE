<?php

namespace App\Services\Ai;

use App\Models\ProductImage;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageEnhancer
{
    /** @param list<string> $operations
     *  @return array{image: ProductImage, skipped: list<string>, background_removed: bool}
     */
    public function enhance(ProductImage $image, array $operations): array
    {
        $skipped = [];
        if (! function_exists('imagecreatefromstring')) {
            throw new \RuntimeException('Le traitement d’image n’est pas disponible sur ce serveur.');
        }

        $disk = Storage::disk('public');
        if (! $disk->exists($image->path)) {
            throw new \RuntimeException('Image originale introuvable.');
        }
        $binary = $disk->get($image->path);
        $src = @imagecreatefromstring($binary ?: '');
        if (! $src) {
            throw new \RuntimeException('Format d’image non lisible.');
        }

        $remove = in_array('remove_background', $operations, true);
        $removed = false;
        if (in_array('brightness', $operations, true)) {
            imagefilter($src, IMG_FILTER_BRIGHTNESS, 12);
        }
        if ($remove) {
            $cut = $this->cutBackground($this->duplicate($src));
            if ($cut) {
                imagedestroy($src);
                $src = $cut;
                $removed = true;
            } else {
                $skipped[] = 'remove_background';
            }
        }
        if (in_array('crop', $operations, true)) {
            $src = $this->square($src, $removed);
        }
        $src = $this->limit($src, 1200, $removed);

        $ext = $removed ? 'png' : 'jpg';
        $name = 'products/catalogue-'.Str::uuid().'.'.$ext;
        ob_start();
        if ($removed) {
            imagealphablending($src, false);
            imagesavealpha($src, true);
            imagepng($src, null, 6);
        } else {
            imagejpeg($src, null, 82);
        }
        $out = ob_get_clean() ?: '';
        imagedestroy($src);
        $disk->put($name, $out);

        $copy = $image->product->images()->create([
            'path' => $name,
            'role' => 'other',
            'label' => $removed ? 'Sans fond' : 'Version catalogue',
            'order' => $image->product->images()->count(),
        ]);

        return ['image' => $copy, 'skipped' => $skipped, 'background_removed' => $removed];
    }

    private function duplicate(\GdImage $src): \GdImage
    {
        $w = imagesx($src);
        $h = imagesy($src);
        $dst = imagecreatetruecolor($w, $h);
        imagealphablending($dst, false);
        imagesavealpha($dst, true);
        $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
        imagefilledrectangle($dst, 0, 0, $w, $h, $transparent);
        imagecopy($dst, $src, 0, 0, 0, 0, $w, $h);

        return $dst;
    }

    private function cutBackground(\GdImage $src): ?\GdImage
    {
        $src = $this->toTrueColor($src);
        $src = $this->limit($src, 720, true);
        $w = imagesx($src);
        $h = imagesy($src);
        $bg = $this->borderAverage($src);
        if ($bg === null || $w < 8 || $h < 8) {
            imagedestroy($src);

            return null;
        }

        $threshold = 48 * 48;
        $clear = imagecolorallocatealpha($src, 0, 0, 0, 127);
        $seen = str_repeat("\0", $w * $h);
        $queue = new \SplQueue();
        $push = function (int $x, int $y) use (&$queue, &$seen, $w, $h): void {
            if ($x < 0 || $y < 0 || $x >= $w || $y >= $h) {
                return;
            }
            $index = $y * $w + $x;
            if ($seen[$index] === "\1") {
                return;
            }
            $seen[$index] = "\1";
            $queue->enqueue([$x, $y]);
        };
        for ($x = 0; $x < $w; $x++) {
            $push($x, 0);
            $push($x, $h - 1);
        }
        for ($y = 1; $y < $h - 1; $y++) {
            $push(0, $y);
            $push($w - 1, $y);
        }

        $cleared = 0;
        while (! $queue->isEmpty()) {
            [$x, $y] = $queue->dequeue();
            $rgba = imagecolorat($src, $x, $y);
            $alpha = ($rgba >> 24) & 0x7F;
            $red = ($rgba >> 16) & 0xFF;
            $green = ($rgba >> 8) & 0xFF;
            $blue = $rgba & 0xFF;
            $alreadyClear = $alpha > 100;
            if (! $alreadyClear) {
                $dr = $red - $bg[0];
                $dg = $green - $bg[1];
                $db = $blue - $bg[2];
                if (($dr * $dr) + ($dg * $dg) + ($db * $db) > $threshold) {
                    continue;
                }
                imagesetpixel($src, $x, $y, $clear);
                $cleared++;
            }
            $push($x + 1, $y);
            $push($x - 1, $y);
            $push($x, $y + 1);
            $push($x, $y - 1);
        }

        $total = $w * $h;
        $ratio = $cleared / $total;
        if ($ratio < 0.04 || $ratio > 0.92) {
            imagedestroy($src);

            return null;
        }

        return $src;
    }

    /** @return array{0: int, 1: int, 2: int}|null */
    private function borderAverage(\GdImage $src): ?array
    {
        $w = imagesx($src);
        $h = imagesy($src);
        $red = $green = $blue = $count = 0;
        $step = max(1, (int) floor(max($w, $h) / 40));
        $sample = function (int $x, int $y) use ($src, &$red, &$green, &$blue, &$count): void {
            $rgba = imagecolorat($src, $x, $y);
            if ((($rgba >> 24) & 0x7F) > 100) {
                return;
            }
            $red += ($rgba >> 16) & 0xFF;
            $green += ($rgba >> 8) & 0xFF;
            $blue += $rgba & 0xFF;
            $count++;
        };
        for ($x = 0; $x < $w; $x += $step) {
            $sample($x, 0);
            $sample($x, $h - 1);
        }
        for ($y = 0; $y < $h; $y += $step) {
            $sample(0, $y);
            $sample($w - 1, $y);
        }
        if ($count < 4) {
            return null;
        }

        return [(int) round($red / $count), (int) round($green / $count), (int) round($blue / $count)];
    }

    private function toTrueColor(\GdImage $src): \GdImage
    {
        if (imageistruecolor($src)) {
            imagealphablending($src, false);
            imagesavealpha($src, true);

            return $src;
        }
        $w = imagesx($src);
        $h = imagesy($src);
        $dst = imagecreatetruecolor($w, $h);
        imagealphablending($dst, false);
        imagesavealpha($dst, true);
        $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
        imagefilledrectangle($dst, 0, 0, $w, $h, $transparent);
        imagecopy($dst, $src, 0, 0, 0, 0, $w, $h);
        imagedestroy($src);

        return $dst;
    }

    private function square(\GdImage $src, bool $alpha): \GdImage
    {
        $w = imagesx($src);
        $h = imagesy($src);
        $side = min($w, $h);
        $x = (int) (($w - $side) / 2);
        $y = (int) (($h - $side) / 2);
        $dst = imagecreatetruecolor($side, $side);
        if ($alpha) {
            imagealphablending($dst, false);
            imagesavealpha($dst, true);
            $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
            imagefilledrectangle($dst, 0, 0, $side, $side, $transparent);
        }
        imagecopy($dst, $src, 0, 0, $x, $y, $side, $side);
        imagedestroy($src);

        return $dst;
    }

    private function limit(\GdImage $src, int $max, bool $alpha): \GdImage
    {
        $w = imagesx($src);
        $h = imagesy($src);
        if ($w <= $max && $h <= $max) {
            return $src;
        }
        $ratio = min($max / $w, $max / $h);
        $nw = max(1, (int) round($w * $ratio));
        $nh = max(1, (int) round($h * $ratio));
        $dst = imagecreatetruecolor($nw, $nh);
        if ($alpha) {
            imagealphablending($dst, false);
            imagesavealpha($dst, true);
            $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
            imagefilledrectangle($dst, 0, 0, $nw, $nh, $transparent);
        }
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
        imagedestroy($src);

        return $dst;
    }
}
