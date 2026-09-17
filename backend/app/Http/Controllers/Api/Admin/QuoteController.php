<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Quote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class QuoteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(
            Quote::query()
                ->with('product:id,name,slug')
                ->when($request->query('status'), fn ($q, $s) => $q->where('status', $s))
                ->latest()
                ->paginate(min(100, max(1, (int) $request->query('per_page', 50))))
        );
    }

    public function updateStatus(Request $request, Quote $quote): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['new', 'contacted', 'closed'])],
        ]);

        $quote->update($data);

        return response()->json($quote);
    }
}
