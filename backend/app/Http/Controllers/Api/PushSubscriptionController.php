<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use App\Services\NotificationSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    public function vapidPublicKey(): JsonResponse
    {
        $settings = NotificationSettings::get();

        return response()->json([
            'public_key' => $settings['providers']['push_vapid_public'] ?? env('VAPID_PUBLIC_KEY'),
            'enabled' => (bool) ($settings['push_enabled'] ?? true),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'endpoint' => ['required', 'string', 'max:500'],
            'keys.p256dh' => ['nullable', 'string'],
            'keys.auth' => ['nullable', 'string'],
            'contentEncoding' => ['nullable', 'string'],
        ]);

        $sub = PushSubscription::query()->updateOrCreate(
            ['endpoint' => $data['endpoint']],
            [
                'customer_id' => $request->user()->id,
                'public_key' => $data['keys']['p256dh'] ?? null,
                'auth_token' => $data['keys']['auth'] ?? null,
                'content_encoding' => $data['contentEncoding'] ?? 'aesgcm',
            ]
        );

        return response()->json($sub, 201);
    }
}
