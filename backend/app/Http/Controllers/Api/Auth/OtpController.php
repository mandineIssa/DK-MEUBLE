<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OtpController extends Controller
{
    public function __construct(private OtpService $otp) {}

    public function requestOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'channel' => ['nullable', Rule::in(['phone', 'email'])],
            'phone' => ['required_without:email', 'nullable', 'string', 'min:8', 'max:20'],
            'email' => ['required_without:phone', 'nullable', 'email', 'max:190'],
        ]);

        $channel = $data['channel']
            ?? (! empty($data['email']) ? 'email' : 'phone');

        if ($channel === 'email') {
            $email = $this->otp->normalizeEmail($data['email']);
            $plain = $this->otp->requestEmail($email);

            $payload = [
                'message' => 'Code envoyé par e-mail.',
                'channel' => 'email',
                'email' => $email,
            ];

            $mailer = config('mail.default');
            if (app()->environment('local') || in_array($mailer, ['log', 'array'], true)) {
                $payload['debug_code'] = $plain;
                $payload['message'] = 'Mode test : e-mail non réellement envoyé (MAIL_MAILER=log). Utilisez le code affiché.';
            }

            return response()->json($payload);
        }

        $phone = $this->otp->normalizePhone($data['phone']);
        $plain = $this->otp->requestPhone($phone);

        $payload = [
            'message' => 'Code envoyé par SMS.',
            'channel' => 'phone',
            'phone' => $phone,
        ];

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
            'channel' => ['nullable', Rule::in(['phone', 'email'])],
            'phone' => ['required_without:email', 'nullable', 'string'],
            'email' => ['required_without:phone', 'nullable', 'email'],
            'code' => ['required', 'string', 'size:6'],
        ]);

        $channel = $data['channel']
            ?? (! empty($data['email']) ? 'email' : 'phone');

        if ($channel === 'email') {
            $email = $this->otp->normalizeEmail($data['email']);
            $this->otp->verifyEmail($email, $data['code']);

            $customer = Customer::query()->firstOrCreate(
                ['email' => $email],
                ['email_opt_in' => true]
            );

            $token = $customer->createToken('customer-email')->plainTextToken;

            return response()->json([
                'token' => $token,
                'channel' => 'email',
                'customer' => [
                    'id' => $customer->id,
                    'phone' => $customer->phone,
                    'name' => $customer->name,
                    'email' => $customer->email,
                ],
                'is_new' => $customer->wasRecentlyCreated,
            ]);
        }

        $phone = $this->otp->normalizePhone($data['phone']);
        $this->otp->verifyPhone($phone, $data['code']);

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
            'channel' => 'phone',
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
