<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SiteContentService;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    public function index(SiteContentService $content): JsonResponse
    {
        return response()->json($content->allSettings());
    }
}
