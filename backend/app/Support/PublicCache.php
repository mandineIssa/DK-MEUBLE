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
            ->json($data)
            ->header('Cache-Control', "public, max-age={$maxAge}, stale-while-revalidate={$swr}");
    }
}
