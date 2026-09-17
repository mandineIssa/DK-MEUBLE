<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\B2bQuote;
use App\Models\B2bQuoteItem;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class B2bQuoteController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            B2bQuote::query()->with(['company', 'items.product'])->latest()->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'company_id' => ['required', 'exists:companies,id'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'title' => ['required', 'string', 'max:200'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'status' => ['nullable', 'in:draft,sent,accepted,rejected,invoiced'],
            'valid_until' => ['nullable', 'date'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['nullable', 'exists:products,id'],
            'items.*.label' => ['nullable', 'string', 'max:200'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['nullable', 'integer', 'min:0'],
            'items.*.dimensions' => ['nullable', 'string', 'max:120'],
            'items.*.notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $quote = B2bQuote::query()->create([
            'reference' => $this->nextReference(),
            'company_id' => $data['company_id'],
            'customer_id' => $data['customer_id'] ?? null,
            'title' => $data['title'],
            'notes' => $data['notes'] ?? null,
            'status' => $data['status'] ?? 'draft',
            'valid_until' => $data['valid_until'] ?? null,
            'total_amount' => 0,
        ]);

        $this->syncItems($quote, $data['items']);
        $quote->recalculateTotal();

        return response()->json($quote->fresh()->load(['company', 'items.product']), 201);
    }

    public function show(B2bQuote $b2bQuote): JsonResponse
    {
        return response()->json($b2bQuote->load(['company', 'customer', 'items.product', 'invoice']));
    }

    public function update(Request $request, B2bQuote $b2bQuote): JsonResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:200'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'status' => ['sometimes', 'in:draft,sent,accepted,rejected,invoiced'],
            'valid_until' => ['nullable', 'date'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.product_id' => ['nullable', 'exists:products,id'],
            'items.*.label' => ['nullable', 'string', 'max:200'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
            'items.*.unit_price' => ['nullable', 'integer', 'min:0'],
            'items.*.dimensions' => ['nullable', 'string', 'max:120'],
            'items.*.notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $b2bQuote->fill(collect($data)->except('items')->all())->save();

        if (isset($data['items'])) {
            $b2bQuote->items()->delete();
            $this->syncItems($b2bQuote, $data['items']);
            $b2bQuote->recalculateTotal();
        }

        return response()->json($b2bQuote->fresh()->load(['company', 'items.product']));
    }

    public function destroy(B2bQuote $b2bQuote): JsonResponse
    {
        $b2bQuote->delete();

        return response()->json(null, 204);
    }

    private function syncItems(B2bQuote $quote, array $items): void
    {
        foreach ($items as $row) {
            $product = isset($row['product_id']) ? Product::query()->find($row['product_id']) : null;
            $label = $row['label'] ?? $product?->name ?? 'Article';
            $unit = $row['unit_price'] ?? $product?->price ?? 0;

            B2bQuoteItem::query()->create([
                'b2b_quote_id' => $quote->id,
                'product_id' => $product?->id,
                'label' => $label,
                'quantity' => (int) $row['quantity'],
                'unit_price' => (int) $unit,
                'dimensions' => $row['dimensions'] ?? null,
                'notes' => $row['notes'] ?? null,
            ]);
        }
    }

    private function nextReference(): string
    {
        do {
            $ref = 'DQ-'.now()->format('Ymd').'-'.Str::upper(Str::random(4));
        } while (B2bQuote::query()->where('reference', $ref)->exists());

        return $ref;
    }
}
