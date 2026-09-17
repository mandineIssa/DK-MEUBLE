<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class ReviewController extends Controller
{
    public function index(string $slug): JsonResponse
    {
        $product = Product::query()->published()->where('slug', $slug)->firstOrFail();

        $reviews = $product->reviews()
            ->approved()
            ->latest()
            ->get(['id', 'author_name', 'rating', 'title', 'body', 'created_at']);

        $avg = round((float) $product->reviews()->approved()->avg('rating'), 1);
        $count = $product->reviews()->approved()->count();

        return response()->json([
            'average' => $avg,
            'count' => $count,
            'reviews' => $reviews,
        ]);
    }

    public function store(Request $request, string $slug): JsonResponse
    {
        $product = Product::query()->published()->where('slug', $slug)->firstOrFail();

        $data = $request->validate([
            'author_name' => ['required', 'string', 'max:120'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'title' => ['nullable', 'string', 'max:150'],
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $customerId = null;
        $bearer = $request->bearerToken();
        if ($bearer) {
            $token = PersonalAccessToken::findToken($bearer);
            if ($token && $token->tokenable_type === \App\Models\Customer::class) {
                $customerId = $token->tokenable_id;
            }
        }

        $review = ProductReview::query()->create([
            'product_id' => $product->id,
            'customer_id' => $customerId,
            'author_name' => $data['author_name'],
            'rating' => $data['rating'],
            'title' => $data['title'] ?? null,
            'body' => $data['body'],
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Merci ! Votre avis sera publié après modération.',
            'review' => $review->only(['id', 'rating', 'status']),
        ], 201);
    }
}
