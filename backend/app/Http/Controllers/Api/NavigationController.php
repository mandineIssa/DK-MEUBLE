<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NavigationService;
use Illuminate\Http\JsonResponse;

class NavigationController extends Controller
{
    public function index(NavigationService $navigation): JsonResponse
    {
        return response()->json($navigation->assemble());
    }
}
