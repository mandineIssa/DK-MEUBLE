<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function pageview(Request $request, AnalyticsService $analytics): JsonResponse
    {
        $data = $request->validate([
            'path' => ['required', 'string', 'max:500'],
            'title' => ['nullable', 'string', 'max:255'],
            'referrer' => ['nullable', 'string', 'max:1000'],
            'utm_source' => ['nullable', 'string', 'max:120'],
            'utm_medium' => ['nullable', 'string', 'max:120'],
            'utm_campaign' => ['nullable', 'string', 'max:160'],
            'session_id' => ['nullable', 'string', 'max:64'],
            'visitor_id' => ['nullable', 'string', 'max:64'],
            'device' => ['nullable', 'in:desktop,mobile,tablet'],
        ]);

        // Ignore admin / API noise
        $path = $data['path'];
        if (str_starts_with($path, '/admin') || str_starts_with($path, '/api')) {
            return response()->json(['ok' => true, 'skipped' => true]);
        }

        $view = $analytics->track($request, $data);

        return response()->json([
            'ok' => true,
            'id' => $view->id,
            'session_id' => $view->session_id,
            'visitor_id' => $view->visitor_id,
        ], 201);
    }
}
