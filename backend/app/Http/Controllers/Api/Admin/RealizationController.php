<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Realization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class RealizationController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Realization::query()->orderBy('sort_order')->orderByDesc('id')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $realization = Realization::query()->create($data);

        return response()->json($realization, 201);
    }

    public function update(Request $request, Realization $realization): JsonResponse
    {
        $realization->update($this->validated($request));

        return response()->json($realization);
    }

    public function destroy(Realization $realization): JsonResponse
    {
        $realization->delete();

        return response()->json(['message' => 'Réalisation supprimée.']);
    }

    public function storeImage(Request $request, Realization $realization): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        $path = $request->file('image')->store('realizations', 'public');
        $realization->update(['image_url' => $path]);

        return response()->json($realization);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'image_url' => ['nullable', 'string', 'max:2048'],
            'tag' => ['nullable', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', 'in:draft,published'],
        ]);
    }
}
