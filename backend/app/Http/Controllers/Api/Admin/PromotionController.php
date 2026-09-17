<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Promotion;
use App\Services\PromotionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PromotionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status');
        $search = trim((string) $request->query('search', ''));

        $items = Promotion::query()
            ->with(['product.images', 'category', 'creator:id,name,email'])
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($search !== '', function ($q) use ($search) {
                $q->whereHas('product', fn ($p) => $p->where('name', 'like', "%{$search}%"));
            })
            ->latest()
            ->get();

        return response()->json($items);
    }

    public function store(Request $request, PromotionService $service): JsonResponse
    {
        $raw = $this->validated($request);
        $product = Product::query()->findOrFail($raw['product_id']);
        $raw['category_id'] = $raw['category_id'] ?? $product->category_id;
        if (empty($raw['price_original']) && $product->price) {
            $raw['price_original'] = $product->price;
        }

        $data = $service->preparePayload($raw);
        $data['created_by'] = $request->user()?->id;

        $promo = Promotion::query()->create($data);
        $service->audit($promo, 'created', null, $promo->toArray());

        return response()->json($promo->load(['product.images', 'category']), 201);
    }

    public function update(Request $request, Promotion $promotion, PromotionService $service): JsonResponse
    {
        $before = $promotion->only([
            'price_original', 'price_promo', 'discount_percent', 'status', 'stock_quantity', 'end_date', 'is_featured',
        ]);
        $raw = $this->validated($request, false);
        $data = $service->preparePayload($raw, $promotion);
        $promotion->fill($data)->save();

        $action = ($before['price_original'] != $promotion->price_original || $before['price_promo'] != $promotion->price_promo)
            ? 'price'
            : 'updated';
        $service->audit($promotion, $action, $before);

        return response()->json($promotion->fresh()->load(['product.images', 'category']));
    }

    public function updateStatus(Request $request, Promotion $promotion, PromotionService $service): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:draft,active,expired,out_of_stock,rejected'],
        ]);
        $before = ['status' => $promotion->status];
        $payload = $service->preparePayload([
            'status' => $data['status'],
            'price_original' => $promotion->price_original,
            'price_promo' => $promotion->price_promo,
            'start_date' => $promotion->start_date?->toIso8601String(),
            'end_date' => $promotion->end_date?->toIso8601String(),
        ], $promotion);
        $promotion->update(['status' => $payload['status']]);
        $service->audit($promotion, 'status', $before, ['status' => $promotion->status]);

        return response()->json($promotion->fresh()->load(['product.images', 'category']));
    }

    public function destroy(Promotion $promotion): JsonResponse
    {
        $promotion->delete();

        return response()->json(null, 204);
    }

    public function settings(PromotionService $service): JsonResponse
    {
        return response()->json($service->settings());
    }

    public function updateSettings(Request $request, PromotionService $service): JsonResponse
    {
        $data = $request->validate([
            'min_discount_percent' => ['sometimes', 'numeric', 'min:0', 'max:99'],
            'max_discount_percent' => ['sometimes', 'numeric', 'min:1', 'max:99'],
            'min_duration_days' => ['sometimes', 'integer', 'min:1', 'max:365'],
            'max_duration_days' => ['sometimes', 'integer', 'min:1', 'max:365'],
            'max_active' => ['sometimes', 'integer', 'min:1', 'max:1000'],
            'require_approval' => ['sometimes', 'boolean'],
            'legal_text' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'newsletter_enabled' => ['sometimes', 'boolean'],
            'newsletter_frequency' => ['sometimes', 'in:weekly,biweekly,monthly'],
            'expiry_alert_days' => ['sometimes', 'integer', 'min:0', 'max:30'],
            'default_vendor_name' => ['sometimes', 'nullable', 'string', 'max:120'],
        ]);

        return response()->json($service->updateSettings($data));
    }

    public function audits(Promotion $promotion): JsonResponse
    {
        return response()->json($promotion->audits()->with('user:id,name')->limit(50)->get());
    }

    private function validated(Request $request, bool $creating = true): array
    {
        return $request->validate([
            'product_id' => [$creating ? 'required' : 'sometimes', 'exists:products,id'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'price_original' => [$creating ? 'required' : 'sometimes', 'integer', 'min:1'],
            'price_promo' => [$creating ? 'required' : 'sometimes', 'integer', 'min:0'],
            'discount_type' => ['nullable', 'in:percent,fixed'],
            'start_date' => [$creating ? 'required' : 'sometimes', 'date'],
            'end_date' => [$creating ? 'required' : 'sometimes', 'date'],
            'status' => ['nullable', 'in:draft,active,expired,out_of_stock,rejected'],
            'stock_quantity' => ['nullable', 'integer', 'min:0'],
            'is_featured' => ['nullable', 'boolean'],
            'featured_order' => ['nullable', 'integer', 'min:0'],
            'vendor_name' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);
    }
}
