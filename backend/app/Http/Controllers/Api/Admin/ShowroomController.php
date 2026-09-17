<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Showroom;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShowroomController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Showroom::query()->orderBy('display_order')->orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $showroom = Showroom::query()->create($data);

        return response()->json($showroom, 201);
    }

    public function update(Request $request, Showroom $showroom): JsonResponse
    {
        $showroom->update($this->validated($request, true));

        return response()->json($showroom);
    }

    public function destroy(Showroom $showroom): JsonResponse
    {
        $showroom->delete();

        return response()->json(['message' => 'Showroom supprimé.']);
    }

    private function validated(Request $request, bool $updating = false): array
    {
        $req = $updating ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$req, 'string', 'max:150'],
            'address' => [$req, 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:40'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'opening_hours' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ]);
    }
}
