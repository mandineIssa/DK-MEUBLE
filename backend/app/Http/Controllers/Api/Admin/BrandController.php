<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Services\FooterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class BrandController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Brand::query()->withCount('products')->orderBy('display_order')->orderBy('name')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);
        $brand = Brand::query()->create($data);
        app(FooterService::class)->forgetCache();

        return response()->json($brand, 201);
    }

    public function update(Request $request, Brand $brand): JsonResponse
    {
        $data = $this->validated($request, $brand);
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name'] ?? $brand->name);
        }
        $brand->update($data);
        app(FooterService::class)->forgetCache();

        return response()->json($brand);
    }

    public function destroy(Brand $brand): JsonResponse
    {
        $brand->delete();
        app(FooterService::class)->forgetCache();

        return response()->json(['message' => 'Marque supprimée.']);
    }

    public function uploadLogo(Request $request, Brand $brand): JsonResponse
    {
        $request->validate(['logo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp,svg', 'max:2048']]);
        if ($brand->logo_path) {
            Storage::disk('public')->delete($brand->logo_path);
        }
        $path = $request->file('logo')->store('brands', 'public');
        $brand->update(['logo_path' => $path]);

        return response()->json($brand);
    }

    private function validated(Request $request, ?Brand $existing = null): array
    {
        return $request->validate([
            'name' => [$existing ? 'sometimes' : 'required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:140', Rule::unique('brands', 'slug')->ignore($existing?->id)],
            'description' => ['nullable', 'string'],
            'is_featured' => ['nullable', 'boolean'],
            'show_in_footer' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
        ]);
    }
}
