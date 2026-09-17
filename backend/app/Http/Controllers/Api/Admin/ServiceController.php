<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\ServiceRequest;
use App\Services\ServiceModuleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ServiceController extends Controller
{
    public function index(ServiceModuleService $module): JsonResponse
    {
        $module->ensureDefaults();

        return response()->json([
            'services' => Service::query()->ordered()->withCount('requests')->get(),
            'settings' => $module->settings(),
        ]);
    }

    public function store(Request $request, ServiceModuleService $module): JsonResponse
    {
        $data = $this->validated($request);
        $data['slug'] = $module->uniqueSlug($data['title'], $data['slug'] ?? null);
        $data['display_order'] = $data['display_order'] ?? (((int) Service::query()->max('display_order')) + 10);
        $data['is_active'] = $data['is_active'] ?? true;

        $service = Service::create($data);

        return response()->json($service, 201);
    }

    public function update(Request $request, Service $service, ServiceModuleService $module): JsonResponse
    {
        $data = $this->validated($request, true);
        if (isset($data['title']) || array_key_exists('slug', $data)) {
            $data['slug'] = $module->uniqueSlug(
                $data['title'] ?? $service->title,
                $data['slug'] ?? $service->slug,
                $service->id
            );
        }

        $service->update($data);

        return response()->json($service->fresh());
    }

    public function destroy(Service $service): JsonResponse
    {
        $service->delete();

        return response()->json(null, 204);
    }

    public function reorder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['integer', 'exists:services,id'],
        ]);

        DB::transaction(function () use ($data) {
            foreach (array_values($data['order']) as $i => $id) {
                Service::query()->where('id', $id)->update(['display_order' => ($i + 1) * 10]);
            }
        });

        return response()->json(['ok' => true]);
    }

    public function uploadIcon(Request $request, Service $service): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'max:2048'],
        ]);

        $path = $request->file('image')->store('services', 'public');
        $service->update(['icon_image' => $path]);

        return response()->json([
            'path' => $path,
            'url' => Storage::disk('public')->url($path),
            'service' => $service->fresh(),
        ]);
    }

    public function settings(ServiceModuleService $module): JsonResponse
    {
        return response()->json($module->settings());
    }

    public function updateSettings(Request $request, ServiceModuleService $module): JsonResponse
    {
        $data = $request->validate([
            'intro_title' => ['sometimes', 'nullable', 'string', 'max:190'],
            'intro_text' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'request_form_enabled' => ['sometimes', 'boolean'],
            'home_featured_limit' => ['sometimes', 'integer', 'min:0', 'max:12'],
        ]);

        return response()->json($module->updateSettings($data));
    }

    public function requestsIndex(Request $request): JsonResponse
    {
        $query = ServiceRequest::query()->with('service:id,title,slug')->latest();

        if ($request->query('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->query('service')) {
            $query->where('service_id', (int) $request->query('service'));
        }

        return response()->json($query->limit(200)->get());
    }

    public function updateRequestStatus(Request $request, ServiceRequest $serviceRequest): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:nouveau,en_cours,traite,annule'],
            'assigned_to' => ['sometimes', 'nullable', 'string', 'max:120'],
        ]);

        $serviceRequest->update($data);

        return response()->json($serviceRequest->fresh()->load('service:id,title,slug'));
    }

    protected function validated(Request $request, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'title' => [$req, 'string', 'max:190'],
            'slug' => ['sometimes', 'nullable', 'string', 'max:190'],
            'icon' => ['sometimes', 'nullable', 'string', 'max:80'],
            'icon_image' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'short_description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'full_content' => ['sometimes', 'nullable', 'string'],
            'display_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'is_featured' => ['sometimes', 'boolean'],
            'cta_label' => ['sometimes', 'nullable', 'string', 'max:120'],
            'cta_link' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'meta_title' => ['sometimes', 'nullable', 'string', 'max:190'],
            'meta_description' => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);
    }
}
