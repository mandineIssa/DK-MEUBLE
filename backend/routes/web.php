<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'DK MEUBLE API',
        'version' => '1.0',
        'docs' => [
            'settings' => url('/api/settings'),
            'products' => url('/api/products'),
            'categories' => url('/api/categories'),
            'realizations' => url('/api/realizations'),
        ],
        'frontend' => env('FRONTEND_URL', 'http://localhost:3000'),
    ]);
});
