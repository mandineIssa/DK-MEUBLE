<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NavigationService;
use App\Support\PublicCache;
use Illuminate\Http\JsonResponse;

class NavigationController extends Controller
{
    public function index(NavigationService $navigation): JsonResponse
    {
        return PublicCache::json($navigation->assemble(), 120, 600);
    }
}
