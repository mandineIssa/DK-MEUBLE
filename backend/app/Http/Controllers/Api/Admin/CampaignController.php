<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Services\CampaignSender;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampaignController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Campaign::query()->latest()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'channel' => ['required', 'in:sms,email,both'],
            'subject' => ['nullable', 'string', 'max:180'],
            'body' => ['required', 'string', 'max:5000'],
            'audience' => ['nullable', 'in:all,b2b,opt_in'],
            'send_now' => ['nullable', 'boolean'],
        ]);

        $campaign = Campaign::query()->create([
            'title' => $data['title'],
            'channel' => $data['channel'],
            'subject' => $data['subject'] ?? null,
            'body' => $data['body'],
            'audience' => $data['audience'] ?? 'opt_in',
            'status' => 'draft',
        ]);

        if ($request->boolean('send_now')) {
            $campaign = app(CampaignSender::class)->send($campaign);
        }

        return response()->json($campaign, 201);
    }

    public function send(Campaign $campaign, CampaignSender $sender): JsonResponse
    {
        if ($campaign->status === 'sent') {
            return response()->json(['message' => 'Cette campagne a déjà été envoyée.'], 422);
        }

        return response()->json($sender->send($campaign));
    }

    public function destroy(Campaign $campaign): JsonResponse
    {
        if ($campaign->status === 'sending') {
            return response()->json(['message' => 'Campagne en cours d’envoi.'], 422);
        }

        $campaign->delete();

        return response()->json(null, 204);
    }
}
