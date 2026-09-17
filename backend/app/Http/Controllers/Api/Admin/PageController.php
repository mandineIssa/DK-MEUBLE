<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\SiteContentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PageController extends Controller
{
    public function show(string $pageKey, SiteContentService $content): JsonResponse
    {
        $allowed = array_keys(SiteContentService::defaultPages());
        if (! in_array($pageKey, $allowed, true)) {
            return response()->json(['message' => 'Page inconnue.'], 404);
        }

        return response()->json($content->pageBlocks($pageKey));
    }

    public function update(string $pageKey, Request $request, SiteContentService $content): JsonResponse
    {
        $allowed = array_keys(SiteContentService::defaultPages());
        if (! in_array($pageKey, $allowed, true)) {
            return response()->json(['message' => 'Page inconnue.'], 404);
        }

        $data = $request->validate([
            'blocks' => ['required', 'array'],
        ]);

        return response()->json($content->updatePageBlocks($pageKey, $data['blocks']));
    }
}
