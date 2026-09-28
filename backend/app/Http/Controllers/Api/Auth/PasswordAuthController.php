<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class PasswordAuthController extends Controller
{
    public function __construct(private OtpService $otp) {}

    public function identify(Request $request): JsonResponse
    {
        $data = $request->validate([
            'login' => ['required', 'string', 'max:190'],
        ], [
            'login.required' => 'Saisissez votre e-mail ou votre numéro de téléphone.',
        ]);

        $parsed = $this->parseLogin($data['login']);
        $customer = $this->findCustomer($parsed);

        return response()->json([
            'channel' => $parsed['channel'],
            'login' => $parsed['login'],
            'exists' => (bool) $customer,
            'has_password' => (bool) ($customer?->password),
            'has_email' => filled($customer?->email),
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['nullable', 'email', 'max:190', 'required_without:phone'],
            'phone' => ['nullable', 'string', 'max:30', 'required_without:email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'name.required' => 'Indiquez votre nom.',
            'email.required_without' => 'Indiquez votre e-mail ou votre téléphone.',
            'email.email' => 'Cet e-mail n’est pas valide.',
            'phone.required_without' => 'Indiquez votre e-mail ou votre téléphone.',
            'password.required' => 'Choisissez un mot de passe.',
            'password.min' => 'Le mot de passe doit contenir au moins 8 caractères.',
            'password.confirmed' => 'Les deux mots de passe ne correspondent pas.',
        ]);

        $parsed = $this->parseLogin($data['email'] ?? $data['phone']);
        $existing = $this->findCustomer($parsed);

        if ($existing) {
            $message = $existing->password
                ? 'Un compte existe déjà. Saisissez votre mot de passe.'
                : 'Ce compte existe déjà via téléphone ou Google. Connectez-vous par ce moyen, ou définissez un mot de passe.';

            throw ValidationException::withMessages(['login' => [$message]]);
        }

        $customer = Customer::query()->create([
            'name' => trim($data['name']),
            'email' => $parsed['email'],
            'phone' => $parsed['phone'],
            'password' => $data['password'],
            'email_opt_in' => (bool) $parsed['email'],
        ]);

        $token = $customer->createToken('customer-password')->plainTextToken;

        return response()->json([
            'token' => $token,
            'customer' => $this->customerPayload($customer),
            'is_new' => true,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'login' => ['required_without_all:email,phone', 'nullable', 'string', 'max:190'],
            'email' => ['nullable', 'email', 'max:190'],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string'],
        ], [
            'login.required_without_all' => 'Saisissez votre e-mail ou votre numéro de téléphone.',
            'password.required' => 'Indiquez votre mot de passe.',
        ]);

        $parsed = $this->parseLogin($data['login'] ?? $data['email'] ?? $data['phone']);
        $customer = $this->findCustomer($parsed);

        if ($customer && ! $customer->password) {
            throw ValidationException::withMessages([
                'password' => ['Ce compte n’a pas encore de mot de passe. Utilisez Google, le code SMS, ou définissez un mot de passe.'],
            ]);
        }

        if (! $customer || ! Hash::check($data['password'], (string) $customer->password)) {
            throw ValidationException::withMessages([
                'password' => ['Mot de passe incorrect.'],
            ]);
        }

        $token = $customer->createToken('customer-password')->plainTextToken;

        return response()->json([
            'token' => $token,
            'customer' => $this->customerPayload($customer),
            'is_new' => false,
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:190'],
        ], [
            'email.required' => 'Indiquez votre e-mail.',
            'email.email' => 'Cet e-mail n’est pas valide.',
        ]);

        $email = $this->otp->normalizeEmail($data['email']);
        $customer = Customer::query()->where('email', $email)->first();

        if (! $customer) {
            throw ValidationException::withMessages([
                'email' => ['Aucun compte avec cet e-mail. Créez un compte.'],
            ]);
        }

        $plain = $this->otp->requestEmail($email);

        $payload = [
            'message' => 'Un code a été envoyé à cet e-mail. Il est valable 5 minutes.',
            'email' => $email,
        ];

        if (app()->environment('local') && config('app.debug')) {
            $payload['debug_code'] = $plain;
        }

        return response()->json($payload);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:190'],
            'code' => ['required', 'string', 'size:6'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'code.required' => 'Saisissez le code reçu par e-mail.',
            'code.size' => 'Le code comporte 6 chiffres.',
            'password.min' => 'Le mot de passe doit contenir au moins 8 caractères.',
            'password.confirmed' => 'Les deux mots de passe ne correspondent pas.',
        ]);

        $email = $this->otp->normalizeEmail($data['email']);
        $this->otp->verifyEmail($email, $data['code']);

        $customer = Customer::query()->where('email', $email)->first();
        if (! $customer) {
            throw ValidationException::withMessages([
                'email' => ['Aucun compte avec cet e-mail. Créez un compte.'],
            ]);
        }

        $customer->forceFill(['password' => $data['password']])->save();
        $customer->tokens()->delete();

        $token = $customer->createToken('customer-password')->plainTextToken;

        return response()->json([
            'token' => $token,
            'customer' => $this->customerPayload($customer),
            'is_new' => false,
        ]);
    }

    /**
     * @return array{channel: 'email'|'phone', login: string, email: ?string, phone: ?string}
     */
    private function parseLogin(string $raw): array
    {
        $raw = trim($raw);

        if (str_contains($raw, '@')) {
            $email = $this->otp->normalizeEmail($raw);
            if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw ValidationException::withMessages([
                    'login' => ['Saisissez un e-mail ou un numéro de téléphone valide.'],
                ]);
            }

            return [
                'channel' => 'email',
                'login' => $email,
                'email' => $email,
                'phone' => null,
            ];
        }

        $phone = $this->otp->normalizePhone($raw);
        if (strlen($phone) < 11) {
            throw ValidationException::withMessages([
                'login' => ['Saisissez un e-mail ou un numéro de téléphone valide.'],
            ]);
        }

        return [
            'channel' => 'phone',
            'login' => '+'.$phone,
            'email' => null,
            'phone' => $phone,
        ];
    }

    /**
     * @param  array{email: ?string, phone: ?string}  $parsed
     */
    private function findCustomer(array $parsed): ?Customer
    {
        if ($parsed['email']) {
            return Customer::query()->where('email', $parsed['email'])->first();
        }

        return Customer::query()->where('phone', $parsed['phone'])->first();
    }

    private function customerPayload(Customer $customer): array
    {
        return [
            'id' => $customer->id,
            'phone' => $customer->phone,
            'name' => $customer->name,
            'email' => $customer->email,
        ];
    }
}
