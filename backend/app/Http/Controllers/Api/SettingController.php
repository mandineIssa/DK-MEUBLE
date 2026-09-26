<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SiteContentService;
use App\Support\PublicCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Throwable;

class SettingController extends Controller
{
    public function index(SiteContentService $content): JsonResponse
    {
        try {
            return PublicCache::json($content->allSettings(), 120, 600);
        } catch (Throwable $e) {
            report($e);
            try {
                Cache::forget('site:settings:v2');
            } catch (Throwable) {
                // ignore
            }

            try {
                return PublicCache::json($content->allSettings(), 30, 60);
            } catch (Throwable $e2) {
                report($e2);

                return response()->json([
                    'message' => 'Paramètres temporairement indisponibles.',
                ], 503);
            }
        }
    }
}
