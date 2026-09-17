<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(
            ContactMessage::query()
                ->when($request->query('status'), fn ($q, $s) => $q->where('status', $s))
                ->latest()
                ->paginate(min(100, max(1, (int) $request->query('per_page', 50))))
        );
    }

    public function updateStatus(Request $request, ContactMessage $message): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:new,read'],
        ]);

        $message->update($data);

        return response()->json($message);
    }
}
