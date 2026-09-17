<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\ContentReport;
use App\Models\NotificationPreference;
use App\Services\NotificationService;
use App\Services\NotificationSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $type = $request->string('type')->toString();
        $q = AppNotification::query()
            ->where('customer_id', $request->user()->id)
            ->latest();

        if ($type !== '') {
            $q->where('type', $type);
        }

        $unread = AppNotification::query()
            ->where('customer_id', $request->user()->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'unread_count' => $unread,
            'data' => $q->paginate(min(50, max(1, (int) $request->input('per_page', 20)))),
        ]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $count = AppNotification::query()
            ->where('customer_id', $request->user()->id)
            ->where('is_read', false)
            ->count();

        return response()->json(['unread_count' => $count]);
    }

    public function markRead(Request $request, int $id): JsonResponse
    {
        $n = AppNotification::query()
            ->where('customer_id', $request->user()->id)
            ->findOrFail($id);
        $n->update(['is_read' => true]);

        return response()->json($n);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        AppNotification::query()
            ->where('customer_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'Toutes les notifications ont été marquées comme lues.']);
    }

    public function preferences(Request $request): JsonResponse
    {
        $types = NotificationSettings::types();
        $rows = NotificationPreference::query()
            ->where('customer_id', $request->user()->id)
            ->get()
            ->keyBy('type');

        $out = [];
        foreach ($types as $type) {
            $row = $rows->get($type);
            $out[] = [
                'type' => $type,
                'email_enabled' => $row?->email_enabled ?? true,
                'sms_enabled' => $row?->sms_enabled ?? false,
                'whatsapp_enabled' => $row?->whatsapp_enabled ?? true,
                'in_app_enabled' => $row?->in_app_enabled ?? true,
                'locked' => in_array($type, NotificationSettings::get()['critical_types'] ?? [], true),
            ];
        }

        return response()->json(['data' => $out]);
    }

    public function updatePreferences(Request $request): JsonResponse
    {
        $data = $request->validate([
            'preferences' => ['required', 'array'],
            'preferences.*.type' => ['required', 'string'],
            'preferences.*.email_enabled' => ['sometimes', 'boolean'],
            'preferences.*.sms_enabled' => ['sometimes', 'boolean'],
            'preferences.*.whatsapp_enabled' => ['sometimes', 'boolean'],
            'preferences.*.in_app_enabled' => ['sometimes', 'boolean'],
        ]);

        $critical = NotificationSettings::get()['critical_types'] ?? [];
        $customerId = $request->user()->id;

        foreach ($data['preferences'] as $pref) {
            if (in_array($pref['type'], $critical, true)) {
                continue;
            }
            NotificationPreference::query()->updateOrCreate(
                ['customer_id' => $customerId, 'type' => $pref['type']],
                [
                    'email_enabled' => $pref['email_enabled'] ?? true,
                    'sms_enabled' => $pref['sms_enabled'] ?? false,
                    'whatsapp_enabled' => $pref['whatsapp_enabled'] ?? true,
                    'in_app_enabled' => $pref['in_app_enabled'] ?? true,
                ]
            );
        }

        return $this->preferences($request);
    }

    public function report(Request $request, NotificationService $notifications): JsonResponse
    {
        $data = $request->validate([
            'reportable_type' => ['required', 'string', 'in:product_review,product'],
            'reportable_id' => ['required', 'integer'],
            'reason' => ['required', 'string', 'max:120'],
            'details' => ['nullable', 'string', 'max:2000'],
        ]);

        $map = [
            'product_review' => \App\Models\ProductReview::class,
            'product' => \App\Models\Product::class,
        ];

        $report = ContentReport::query()->create([
            'customer_id' => $request->user()->id,
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
                'link' => '/admin/notifications',
            ],
            '/admin/notifications',
        );

        return response()->json($report, 201);
    }
}
