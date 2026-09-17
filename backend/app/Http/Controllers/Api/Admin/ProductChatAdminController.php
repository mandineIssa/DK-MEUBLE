<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductChat;
use App\Models\ProductChatMessage;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductChatAdminController extends Controller
{
    public function index(): JsonResponse
    {
        $chats = ProductChat::query()
            ->with(['product:id,name,slug', 'customer:id,name,phone,email'])
            ->withCount(['messages as unread_count' => fn ($q) => $q->where('sender_type', 'customer')->where('is_read', false)])
            ->orderByDesc('last_message_at')
            ->paginate(30);

        return response()->json($chats);
    }

    public function messages(int $id): JsonResponse
    {
        $chat = ProductChat::query()->with(['product', 'customer'])->findOrFail($id);
        ProductChatMessage::query()
            ->where('product_chat_id', $chat->id)
            ->where('sender_type', 'customer')
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'chat' => $chat,
            'data' => $chat->messages()->orderBy('id')->limit(200)->get(),
        ]);
    }

    public function reply(Request $request, int $id, NotificationService $notifications): JsonResponse
    {
        $data = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $chat = ProductChat::query()->with(['customer', 'product'])->findOrFail($id);

        $msg = ProductChatMessage::query()->create([
            'product_chat_id' => $chat->id,
            'sender_type' => 'admin',
            'sender_id' => $request->user()->id,
            'body' => $data['body'],
            'is_read' => false,
        ]);

        $chat->update(['last_message_at' => now()]);

        if ($chat->customer) {
            $notifications->notify(
                'chat_reply',
                [
                    'customer_name' => $chat->customer->name ?: '',
                    'product_name' => $chat->product?->name ?? '',
                    'message' => $data['body'],
                    'link' => $chat->product ? '/produits/'.$chat->product->slug : '/compte/notifications',
                ],
                $chat->customer,
                null,
                $chat->product ? '/produits/'.$chat->product->slug : '/compte/notifications',
            );
        }

        return response()->json($msg, 201);
    }
}
