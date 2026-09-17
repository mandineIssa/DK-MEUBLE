<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\ServiceRequest;
use App\Services\ServiceModuleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ServiceController extends Controller
{
    public function index(ServiceModuleService $module): JsonResponse
    {
        $module->ensureDefaults();

        $services = Service::query()
            ->active()
            ->ordered()
            ->get()
            ->map(fn (Service $s) => $this->listPayload($s));

        return response()->json([
            'services' => $services,
            'settings' => $module->settings(),
        ]);
    }

    public function show(string $slug, ServiceModuleService $module): JsonResponse
    {
        $module->ensureDefaults();

        $service = Service::query()->active()->where('slug', $slug)->firstOrFail();

        return response()->json([
            'service' => $this->detailPayload($service),
            'settings' => $module->settings(),
            'siblings' => Service::query()
                ->active()
                ->ordered()
                ->where('id', '!=', $service->id)
                ->limit(4)
                ->get()
                ->map(fn (Service $s) => $this->listPayload($s)),
        ]);
    }

    public function storeRequest(string $slug, Request $request, ServiceModuleService $module, \App\Services\NotificationService $notifications): JsonResponse
    {
        $settings = $module->settings();
        if (! ($settings['request_form_enabled'] ?? true)) {
            return response()->json(['message' => 'Les demandes en ligne sont désactivées.'], 422);
        }

        $service = Service::query()->active()->where('slug', $slug)->firstOrFail();

        $data = $request->validate([
            'customer_name' => ['required', 'string', 'max:120'],
            'phone' => ['required', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:190'],
            'product_reference' => ['nullable', 'string', 'max:120'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $row = ServiceRequest::create([
            ...$data,
            'service_id' => $service->id,
            'status' => 'nouveau',
        ]);

        $notifications->notifyAdmins(
            'service_request',
            [
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['phone'],
                'service_name' => $service->title,
                'link' => '/admin/services/demandes',
            ],
            '/admin/services/demandes',
        );

        return response()->json([
            'message' => 'Votre demande a bien été envoyée. Nous vous recontacterons rapidement.',
            'id' => $row->id,
        ], 201);
    }

    protected function listPayload(Service $s): array
    {
        return [
            'id' => $s->id,
            'title' => $s->title,
            'slug' => $s->slug,
            'icon' => $s->icon,
            'icon_image' => $this->mediaUrl($s->icon_image),
            'short_description' => $s->short_description,
            'cta_label' => $s->cta_label ?: 'Voir plus',
            'cta_link' => $s->cta_link,
            'display_order' => $s->display_order,
            'is_featured' => $s->is_featured,
        ];
    }

    protected function detailPayload(Service $s): array
    {
        return array_merge($this->listPayload($s), [
            'full_content' => $s->full_content,
            'meta_title' => $s->meta_title ?: $s->title,
            'meta_description' => $s->meta_description ?: $s->short_description,
        ]);
    }

    protected function mediaUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        $relative = Storage::disk('public')->url($path);

        return rtrim((string) config('app.url'), '/').'/'.ltrim($relative, '/');
    }
}
