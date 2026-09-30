<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductImage;
use App\Services\Ai\AiClient;
use App\Services\Ai\CatalogAssistant;
use App\Services\Ai\ImageEnhancer;
use App\Services\Ai\InsightService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiAdminController extends Controller
{
    public function insights(InsightService $insights): JsonResponse
    {
        return response()->json($insights->dashboard());
    }

    public function settings(AiClient $ai): JsonResponse
    {
        return response()->json($ai->adminStatus());
    }

    public function updateSettings(Request $request, AiClient $ai): JsonResponse
    {
        $data = $request->validate([
            'enabled' => ['sometimes', 'boolean'],
            'assistant_enabled' => ['sometimes', 'boolean'],
            'provider' => ['sometimes', 'string', 'max:40'],
            'model' => ['sometimes', 'string', 'max:80'],
            'base_url' => ['sometimes', 'nullable', 'string', 'max:200', 'regex:/^$|^https?:\\/\\/.+/'],
            'timeout' => ['sometimes', 'integer', 'min:3', 'max:60'],
            'retries' => ['sometimes', 'integer', 'min:0', 'max:3'],
            'system_prompt' => ['sometimes', 'string', 'max:4000'],
        ]);
        $ai->saveSettings($data);

        return response()->json($ai->adminStatus());
    }

    public function describe(Request $request, CatalogAssistant $assistant): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'brand' => ['nullable', 'string', 'max:120'],
            'category' => ['nullable', 'string', 'max:120'],
            'specs' => ['nullable', 'string', 'max:4000'],
            'price' => ['nullable', 'integer', 'min:0'],
            'warranty' => ['nullable', 'string', 'max:120'],
        ]);

        return response()->json($assistant->describe($data));
    }

    public function enhanceImage(Request $request, ProductImage $image, ImageEnhancer $enhancer): JsonResponse
    {
        $data = $request->validate([
            'operations' => ['required', 'array', 'min:1'],
            'operations.*' => ['in:brightness,crop,resize,compress,remove_background'],
        ]);
        $result = $enhancer->enhance($image, $data['operations']);

        $message = 'Une nouvelle image a été ajoutée. L’originale est conservée.';
        if ($result['background_removed']) {
            $message = 'Une nouvelle image a été ajoutée, sans le fond relié aux bords. L’originale est conservée.';
        } elseif (in_array('remove_background', $result['skipped'], true)) {
            $message = 'L’originale est conservée. Le fond n’a pas pu être séparé du produit, la nouvelle image garde donc son arrière-plan.';
        }

        return response()->json([
            'image' => $result['image'],
            'skipped' => $result['skipped'],
            'message' => $message,
        ]);
    }
}
