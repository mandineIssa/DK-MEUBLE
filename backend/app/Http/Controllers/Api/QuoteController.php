<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreQuoteRequest;
use App\Models\Customer;
use App\Models\Quote;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Laravel\Sanctum\PersonalAccessToken;

class QuoteController extends Controller
{
    public function store(StoreQuoteRequest $request, NotificationService $notifications): JsonResponse
    {
        $data = $request->validated();

        if ($bearer = $request->bearerToken()) {
            $token = PersonalAccessToken::findToken($bearer);
            $owner = $token?->tokenable;
            if ($owner instanceof Customer) {
                $data['customer_id'] = $owner->id;
                if (empty($data['phone']) && $owner->phone) {
                    $data['phone'] = $owner->phone;
                }
                if (empty($data['name']) && $owner->name) {
                    $data['name'] = $owner->name;
                }
                if (empty($data['email']) && $owner->email) {
                    $data['email'] = $owner->email;
                }
            }
        }

        $quote = Quote::create($data);

        $notifications->notifyAdmins(
            'service_request',
            [
                'service_name' => 'Devis',
                'customer_name' => $quote->name ?: 'Client',
                'customer_phone' => $quote->phone ?: '',
                'message' => $quote->message ?: '',
                'link' => '/admin/devis',
            ],
            '/admin/devis',
        );

        return response()->json([
            'message' => 'Votre demande de devis a bien été envoyée.',
        ], 201);
    }
}
