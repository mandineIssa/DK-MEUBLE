<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreContactRequest;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Schema;
use Throwable;

class ContactController extends Controller
{
    public function store(StoreContactRequest $request): JsonResponse
    {
        try {
            if (! Schema::hasTable('contact_messages')) {
                return response()->json([
                    'message' => 'Service contact indisponible. Lancez les migrations sur le serveur.',
                ], 503);
            }

            ContactMessage::query()->create($request->validated());
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Impossible d’envoyer le message pour le moment. Réessayez plus tard.',
            ], 500);
        }

        return response()->json([
            'message' => 'Votre message a bien été envoyé.',
        ], 201);
    }
}
