<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SiteContentService;
use App\Support\PublicCache;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    public function index(SiteContentService $content): JsonResponse
    {
        return PublicCache::json($content->allSettings(), 120, 600);
    }
}
