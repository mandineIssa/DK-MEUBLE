<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\B2bQuote;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class InvoiceController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Invoice::query()->with(['company', 'quote'])->latest()->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'company_id' => ['required', 'exists:companies,id'],
            'b2b_quote_id' => ['nullable', 'exists:b2b_quotes,id'],
            'customer_id' => ['nullable', 'exists:customers,id'],
            'title' => ['required', 'string', 'max:200'],
            'amount' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', 'in:draft,sent,paid,cancelled'],
            'issued_at' => ['nullable', 'date'],
            'due_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $amount = $data['amount'] ?? null;
        if ($amount === null && ! empty($data['b2b_quote_id'])) {
            $amount = B2bQuote::query()->find($data['b2b_quote_id'])?->total_amount ?? 0;
        }

        $invoice = Invoice::query()->create([
            'reference' => $this->nextReference(),
            'company_id' => $data['company_id'],
            'b2b_quote_id' => $data['b2b_quote_id'] ?? null,
            'customer_id' => $data['customer_id'] ?? null,
            'title' => $data['title'],
            'amount' => (int) ($amount ?? 0),
            'status' => $data['status'] ?? 'draft',
            'issued_at' => $data['issued_at'] ?? now()->toDateString(),
            'due_at' => $data['due_at'] ?? now()->addDays(30)->toDateString(),
            'notes' => $data['notes'] ?? null,
        ]);

        if (! empty($data['b2b_quote_id'])) {
            B2bQuote::query()->whereKey($data['b2b_quote_id'])->update(['status' => 'invoiced']);
        }

        return response()->json($invoice->load(['company', 'quote']), 201);
    }

    public function update(Request $request, Invoice $invoice): JsonResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:200'],
            'amount' => ['sometimes', 'integer', 'min:0'],
            'status' => ['sometimes', 'in:draft,sent,paid,cancelled'],
            'issued_at' => ['nullable', 'date'],
            'due_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $invoice->update($data);

        return response()->json($invoice->fresh()->load(['company', 'quote']));
    }

    public function destroy(Invoice $invoice): JsonResponse
    {
        $invoice->delete();

        return response()->json(null, 204);
    }

    private function nextReference(): string
    {
        do {
            $ref = 'FA-'.now()->format('Ymd').'-'.Str::upper(Str::random(4));
        } while (Invoice::query()->where('reference', $ref)->exists());

        return $ref;
    }
}
