<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Realization;
use Illuminate\Http\JsonResponse;

class RealizationController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Realization::query()
                ->where('status', 'published')
                ->orderBy('sort_order')
                ->orderByDesc('id')
                ->get()
        );
    }
}
