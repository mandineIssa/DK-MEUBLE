<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FooterService;
use Illuminate\Http\JsonResponse;

class FooterController extends Controller
{
    public function show(FooterService $footer): JsonResponse
    {
        return response()->json($footer->assemble());
    }
}
