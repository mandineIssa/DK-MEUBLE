<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Showroom;
use Illuminate\Http\JsonResponse;

class ShowroomController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Showroom::query()->active()->orderBy('display_order')->orderBy('name')->get()
        );
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(Showroom::query()->active()->findOrFail($id));
    }
}
