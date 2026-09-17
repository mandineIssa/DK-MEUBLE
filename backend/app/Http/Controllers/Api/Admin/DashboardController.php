<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Product;
use App\Models\Quote;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        return response()->json([
            'products' => Product::query()->count(),
            'products_published' => Product::query()->where('status', 'published')->count(),
            'quotes_new' => Quote::query()->where('status', 'new')->count(),
            'messages_new' => ContactMessage::query()->where('status', 'new')->count(),
        ]);
    }
}
