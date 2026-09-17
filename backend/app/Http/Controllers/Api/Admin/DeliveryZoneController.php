<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\DeliveryZone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryZoneController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(DeliveryZone::query()->orderBy('display_order')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'zone_name' => ['required', 'string', 'max:120'],
            'city' => ['nullable', 'string', 'max:100'],
            'delivery_fee' => ['required', 'integer', 'min:0'],
            'estimated_delay' => ['nullable', 'string', 'max:120'],
            'is_active' => ['nullable', 'boolean'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ]);

        return response()->json(DeliveryZone::query()->create($data), 201);
    }

    public function update(Request $request, DeliveryZone $deliveryZone): JsonResponse
    {
        $data = $request->validate([
            'zone_name' => ['sometimes', 'string', 'max:120'],
            'city' => ['nullable', 'string', 'max:100'],
            'delivery_fee' => ['sometimes', 'integer', 'min:0'],
            'estimated_delay' => ['nullable', 'string', 'max:120'],
            'is_active' => ['nullable', 'boolean'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ]);
        $deliveryZone->update($data);

        return response()->json($deliveryZone);
    }

    public function destroy(DeliveryZone $deliveryZone): JsonResponse
    {
        $deliveryZone->delete();

        return response()->json(null, 204);
    }
}
