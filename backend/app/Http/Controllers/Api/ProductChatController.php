<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductChat;
use App\Models\ProductChatMessage;
use App\Services\NotificationService;
use App\Services\NotificationSettings;
use App\Services\ProductChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductChatController extends Controller
{
    public function open(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
        ]);

        $chat = ProductChat::query()->firstOrCreate(
            [
                'product_id' => $data['product_id'],
                'customer_id' => $request->user()->id,
            ],
            ['status' => 'open']
        );

        $chat->load('product:id,name,slug');

        return response()->json($chat);
    }

    public function messages(Request $request, int $id): JsonResponse
    {
        $chat = ProductChat::query()
            ->where('customer_id', $request->user()->id)
            ->findOrFail($id);

        $q = ProductChatMessage::query()
            ->where('product_chat_id', $chat->id)
            ->orderBy('id');

        if ($after = (int) $request->query('after')) {
            $q->where('id', '>', $after);
        }

        return response()->json(['data' => $q->limit(100)->get()]);
    }

    public function send(
        Request $request,
        int $id,
        NotificationService $notifications,
        ProductChatService $chats,
    ): JsonResponse {
        $data = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $settings = NotificationSettings::get();
        $limit = (int) ($settings['chat_rate_limit_per_hour'] ?? 30);
        $recent = ProductChatMessage::query()
            ->where('sender_type', 'customer')
            ->where('sender_id', $request->user()->id)
            ->where('created_at', '>=', now()->subHour())
            ->count();
        if ($recent >= max(1, $limit)) {
            return response()->json(['message' => 'Trop de messages. Réessayez plus tard.'], 429);
        }

        $chat = ProductChat::query()
            ->with(['product.promotions'])
            ->where('customer_id', $request->user()->id)
            ->findOrFail($id);

        $msg = ProductChatMessage::query()->create([
            'product_chat_id' => $chat->id,
            'sender_type' => 'customer',
            'sender_id' => $request->user()->id,
            'body' => $data['body'],
            'is_read' => false,
        ]);

        $chat->update(['last_message_at' => now(), 'status' => 'open']);

        $autoReplies = $chats->afterCustomerMessage(
            $chat,
            $msg,
            $request->user(),
            $notifications,
        );

        return response()->json([
            'id' => $msg->id,
            'body' => $msg->body,
            'sender_type' => $msg->sender_type,
            'created_at' => $msg->created_at,
            'auto_replies' => collect($autoReplies)->map(fn (ProductChatMessage $r) => [
                'id' => $r->id,
                'body' => $r->body,
                'sender_type' => $r->sender_type,
                'created_at' => $r->created_at,
            ])->values()->all(),
        ], 201);
    }
}
