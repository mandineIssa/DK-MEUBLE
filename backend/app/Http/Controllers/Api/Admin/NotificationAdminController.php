<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendNotificationJob;
use App\Models\ContentReport;
use App\Models\NotificationDeliveryLog;
use App\Models\NotificationTemplate;
use App\Services\NotificationService;
use App\Services\NotificationSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationAdminController extends Controller
{
    public function settings(): JsonResponse
    {
        return response()->json(NotificationSettings::get());
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $data = $request->validate([
            'price_drop_threshold_percent' => ['sometimes', 'numeric', 'min:1', 'max:90'],
            'digest_minutes' => ['sometimes', 'integer', 'min:5', 'max:1440'],
            'abandoned_cart_hours' => ['sometimes', 'integer', 'min:1', 'max:168'],
            'promo_ending_hours' => ['sometimes', 'integer', 'min:1', 'max:168'],
            'push_enabled' => ['sometimes', 'boolean'],
            'report_rate_limit_per_hour' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'chat_rate_limit_per_hour' => ['sometimes', 'integer', 'min:1', 'max:200'],
            'chat_whatsapp_number' => ['sometimes', 'nullable', 'string', 'max:40'],
            'chat_forward_to_whatsapp' => ['sometimes', 'boolean'],
            'chat_auto_reply_enabled' => ['sometimes', 'boolean'],
            'chat_greeting_reply' => ['sometimes', 'string', 'max:1000'],
            'chat_price_reply' => ['sometimes', 'string', 'max:1000'],
            'newsletter_frequency' => ['sometimes', 'string', 'in:daily,weekly,monthly'],
            'channel_fallback' => ['sometimes', 'array'],
            'channel_fallback.*' => ['string', 'in:whatsapp,sms,email'],
            'providers' => ['sometimes', 'array'],
            'types_enabled' => ['sometimes', 'array'],
            'critical_types' => ['sometimes', 'array'],
        ]);

        if (array_key_exists('chat_whatsapp_number', $data) && is_string($data['chat_whatsapp_number'])) {
            $digits = preg_replace('/\D+/', '', $data['chat_whatsapp_number']) ?: '';
            if (strlen($digits) === 9 && str_starts_with($digits, '7')) {
                $digits = '221'.$digits;
            }
            $data['chat_whatsapp_number'] = $digits;
        }

        return response()->json(NotificationSettings::update($data));
    }

    public function templates(): JsonResponse
    {
        return response()->json([
            'data' => NotificationTemplate::query()->orderBy('type')->orderBy('channel')->get(),
            'types' => NotificationSettings::types(),
            'channels' => ['email', 'sms', 'whatsapp', 'in_app', 'push'],
            'variables' => [
                'customer_name', 'customer_phone', 'order_number', 'order_total', 'order_status',
                'product_name', 'old_price', 'new_price', 'service_name', 'reason', 'details', 'link',
            ],
        ]);
    }

    public function storeTemplate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'string', 'max:64'],
            'channel' => ['required', 'in:email,sms,whatsapp,in_app,push'],
            'subject' => ['nullable', 'string', 'max:255'],
            'body_template' => ['required', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $tpl = NotificationTemplate::query()->updateOrCreate(
            ['type' => $data['type'], 'channel' => $data['channel']],
            [
                'subject' => $data['subject'] ?? null,
                'body_template' => $data['body_template'],
                'is_active' => $data['is_active'] ?? true,
            ]
        );

        return response()->json($tpl, 201);
    }

    public function updateTemplate(Request $request, NotificationTemplate $template): JsonResponse
    {
        $data = $request->validate([
            'subject' => ['nullable', 'string', 'max:255'],
            'body_template' => ['sometimes', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
        $template->update($data);

        return response()->json($template->fresh());
    }

    public function preview(Request $request, NotificationService $notifications): JsonResponse
    {
        $data = $request->validate([
            'subject' => ['nullable', 'string'],
            'body_template' => ['required', 'string'],
            'sample' => ['sometimes', 'array'],
        ]);

        $sample = array_merge([
            'customer_name' => 'Amadou Diop',
            'order_number' => 'DK-2026-001',
            'order_total' => '125 000',
            'order_status' => 'expédiée',
            'product_name' => 'Réfrigérateur 350L',
            'old_price' => '200 000',
            'new_price' => '175 000',
            'link' => 'https://dkhometech.sn/produits/exemple',
        ], $data['sample'] ?? []);

        return response()->json([
            'subject' => $notifications->render((string) ($data['subject'] ?? ''), $sample),
            'body' => $notifications->render($data['body_template'], $sample),
        ]);
    }

    public function seedTemplates(NotificationService $notifications): JsonResponse
    {
        return response()->json(['seeded' => $notifications->seedTemplates()]);
    }

    public function stats(): JsonResponse
    {
        $byType = NotificationDeliveryLog::query()
            ->select('type', DB::raw('count(*) as total'))
            ->groupBy('type')
            ->pluck('total', 'type');

        $byChannel = NotificationDeliveryLog::query()
            ->select('channel', DB::raw('count(*) as total'))
            ->groupBy('channel')
            ->pluck('total', 'channel');

        $byStatus = NotificationDeliveryLog::query()
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        return response()->json([
            'by_type' => $byType,
            'by_channel' => $byChannel,
            'by_status' => $byStatus,
            'sent_7d' => NotificationDeliveryLog::query()
                ->where('status', 'sent')
                ->where('created_at', '>=', now()->subDays(7))
                ->count(),
            'failed_7d' => NotificationDeliveryLog::query()
                ->where('status', 'failed')
                ->where('created_at', '>=', now()->subDays(7))
                ->count(),
        ]);
    }

    public function failed(): JsonResponse
    {
        $rows = NotificationDeliveryLog::query()
            ->where('status', 'failed')
            ->latest()
            ->paginate(30);

        return response()->json($rows);
    }

    public function resend(int $id): JsonResponse
    {
        $log = NotificationDeliveryLog::query()->findOrFail($id);
        if (! $log->notification_id) {
            return response()->json(['message' => 'Notification source introuvable.'], 422);
        }

        SendNotificationJob::dispatch($log->notification_id, [$log->channel], $log->payload['vars'] ?? []);
        $log->increment('attempts');

        return response()->json(['message' => 'Renvoi planifié.']);
    }

    public function reports(): JsonResponse
    {
        return response()->json(
            ContentReport::query()->with('customer')->latest()->paginate(30)
        );
    }

    public function updateReport(Request $request, ContentReport $report): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:new,in_progress,resolved'],
        ]);

        $report->update([
            'status' => $data['status'],
            'handled_by' => $request->user()->id,
            'resolved_at' => $data['status'] === 'resolved' ? now() : null,
        ]);

        return response()->json($report->fresh('customer'));
    }
}
