<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContentReport;
use App\Models\Product;
use App\Models\ProductReview;
use App\Services\NotificationService;
use App\Services\NotificationSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class ContentReportController extends Controller
{
    public function store(Request $request, NotificationService $notifications): JsonResponse
    {
        $data = $request->validate([
            'reportable_type' => ['required', 'string', 'in:product_review,product'],
            'reportable_id' => ['required', 'integer'],
            'reason' => ['required', 'string', 'max:120'],
            'details' => ['nullable', 'string', 'max:2000'],
            'reporter_name' => ['required', 'string', 'max:120'],
            'reporter_email' => ['required', 'email', 'max:190'],
            'reporter_phone' => ['required', 'string', 'max:40'],
        ]);

        $isFraud = str_contains(mb_strtolower($data['reason']), 'fraud');
        if ($isFraud && trim((string) ($data['details'] ?? '')) === '') {
            return response()->json([
                'message' => 'Un commentaire justificatif est obligatoire pour un signalement de fraude.',
            ], 422);
        }

        $settings = NotificationSettings::get();
        $limit = (int) ($settings['report_rate_limit_per_hour'] ?? 5);
        $ip = $request->ip();
        $recent = ContentReport::query()
            ->where('created_at', '>=', now()->subHour())
            ->where(function ($q) use ($ip, $data) {
                $q->where('ip_address', $ip)
                    ->orWhere('reporter_email', $data['reporter_email'])
                    ->orWhere('reporter_phone', $data['reporter_phone']);
            })
            ->count();

        if ($recent >= max(1, $limit)) {
            return response()->json([
                'message' => 'Limite de signalements atteinte. Réessayez plus tard.',
            ], 429);
        }

        $map = [
            'product_review' => ProductReview::class,
            'product' => Product::class,
        ];

        $customerId = null;
        if ($bearer = $request->bearerToken()) {
            $token = PersonalAccessToken::findToken($bearer);
            if ($token?->tokenable instanceof \App\Models\Customer) {
                $customerId = $token->tokenable->id;
            }
        }

        $report = ContentReport::query()->create([
            'customer_id' => $customerId,
            'reporter_name' => $data['reporter_name'],
            'reporter_email' => $data['reporter_email'],
            'reporter_phone' => $data['reporter_phone'],
            'ip_address' => $ip,
            'reportable_type' => $map[$data['reportable_type']],
            'reportable_id' => $data['reportable_id'],
            'reason' => $data['reason'],
            'details' => $data['details'] ?? null,
            'status' => 'new',
        ]);

        $notifications->notifyAdmins(
            'content_report',
            [
                'reason' => $report->reason,
                'details' => $report->details ?: '',
                'customer_name' => $report->reporter_name,
                'link' => '/admin/notifications',
            ],
            '/admin/notifications',
        );

        return response()->json($report, 201);
    }
}
