<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status');

        $reviews = ProductReview::query()
            ->with(['product:id,name,slug', 'customer:id,name,phone'])
            ->when($status, fn ($q) => $q->where('status', $status))
            ->latest()
            ->get();

        return response()->json($reviews);
    }

    public function updateStatus(Request $request, ProductReview $review): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:pending,approved,rejected'],
        ]);

        $review->update($data);

        return response()->json($review->fresh()->load(['product:id,name,slug', 'customer:id,name,phone']));
    }

    public function destroy(ProductReview $review): JsonResponse
    {
        $review->delete();

        return response()->json(null, 204);
    }
}
