<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;

final class PublicCache
{
    /**
     * Réponse JSON publique avec cache navigateur / CDN.
     */
    public static function json(mixed $data, int $maxAge = 60, int $swr = 300): JsonResponse
    {
        return response()
            ->json(
                $data,
                200,
                ['Cache-Control' => "public, max-age={$maxAge}, stale-while-revalidate={$swr}"],
                JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
            );
    }
}
