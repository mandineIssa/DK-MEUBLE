<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OtpController extends Controller
{
    public function __construct(private OtpService $otp) {}

    public function requestOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'min:8', 'max:20'],
        ]);

        $phone = $this->otp->normalizePhone($data['phone']);
        $plain = $this->otp->request($phone);

        $payload = [
            'message' => 'Code envoyé par SMS.',
            'phone' => $phone,
        ];

        // En local / driver log : pas de SMS réel — on expose le code pour tester.
        $smsDriver = config('services.sms.driver', env('SMS_DRIVER', 'log'));
        if (app()->environment('local') || $smsDriver === 'log') {
            $payload['debug_code'] = $plain;
            $payload['message'] = 'Mode test : aucun SMS réel (SMS_DRIVER=log). Utilisez le code affiché.';
        }

        return response()->json($payload);
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'phone' => ['required', 'string'],
            'code' => ['required', 'string', 'size:6'],
        ]);

        $phone = $this->otp->normalizePhone($data['phone']);
        $this->otp->verify($phone, $data['code']);

        $customer = Customer::query()->firstOrCreate(
            ['phone' => $phone],
            ['phone_verified_at' => now()]
        );

        if (! $customer->phone_verified_at) {
            $customer->forceFill(['phone_verified_at' => now()])->save();
        }

        $token = $customer->createToken('customer')->plainTextToken;

        return response()->json([
            'token' => $token,
            'customer' => [
                'id' => $customer->id,
                'phone' => $customer->phone,
                'name' => $customer->name,
                'email' => $customer->email,
            ],
            'is_new' => $customer->wasRecentlyCreated,
        ]);
    }
}
