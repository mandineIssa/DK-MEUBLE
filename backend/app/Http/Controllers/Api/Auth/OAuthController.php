<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class OAuthController extends Controller
{
    public function providers(): JsonResponse
    {
        return response()->json([
            'google' => filled(config('services.google.client_id'))
                && filled(config('services.google.client_secret')),
            'facebook' => filled(config('services.facebook.client_id'))
                && filled(config('services.facebook.client_secret')),
        ]);
    }

    public function redirect(string $provider): RedirectResponse|Response
    {
        $this->assertProvider($provider);
        $frontend = $this->frontendUrl();

        if (! $this->isConfigured($provider)) {
            return redirect($frontend.'/compte/connexion?error=oauth_config');
        }

        try {
            return Socialite::driver($provider)->stateless()->redirect();
        } catch (Throwable $e) {
            return redirect($frontend.'/compte/connexion?error=oauth_config');
        }
    }

    public function callback(string $provider, Request $request): RedirectResponse
    {
        $this->assertProvider($provider);
        $frontend = $this->frontendUrl();

        if (! $this->isConfigured($provider)) {
            return redirect($frontend.'/compte/connexion?error=oauth_config');
        }

        try {
            $socialUser = Socialite::driver($provider)->stateless()->user();
        } catch (Throwable $e) {
            return redirect($frontend.'/compte/connexion?error=oauth_failed');
        }

        $idField = $provider === 'google' ? 'google_id' : 'facebook_id';

        $customer = Customer::query()
            ->where($idField, $socialUser->getId())
            ->when($socialUser->getEmail(), fn ($q) => $q->orWhere('email', $socialUser->getEmail()))
            ->first();

        if (! $customer) {
            $customer = Customer::query()->create([
                $idField => $socialUser->getId(),
                'email' => $socialUser->getEmail(),
                'name' => $socialUser->getName(),
            ]);
        } else {
            $customer->fill([
                $idField => $socialUser->getId(),
                'email' => $customer->email ?: $socialUser->getEmail(),
                'name' => $customer->name ?: $socialUser->getName(),
            ])->save();
        }

        $token = $customer->createToken('customer-oauth')->plainTextToken;

        return redirect($frontend.'/compte/oauth/callback?token='.urlencode($token));
    }

    private function assertProvider(string $provider): void
    {
        abort_unless(in_array($provider, ['google', 'facebook'], true), 404);
    }

    private function isConfigured(string $provider): bool
    {
        return filled(config("services.{$provider}.client_id"))
            && filled(config("services.{$provider}.client_secret"));
    }

    private function frontendUrl(): string
    {
        $configured = rtrim((string) config('app.frontend_url', ''), '/');

        if ($configured !== '' && ! str_contains($configured, 'localhost')) {
            return $configured;
        }

        $referer = (string) request()->headers->get('Referer', '');
        if ($referer !== '') {
            $parts = parse_url($referer);
            if (! empty($parts['scheme']) && ! empty($parts['host']) && ! str_contains($parts['host'], 'localhost')) {
                $port = isset($parts['port']) ? ':'.$parts['port'] : '';

                return $parts['scheme'].'://'.$parts['host'].$port;
            }
        }

        if ($configured !== '') {
            return $configured;
        }

        return 'https://dkhometech.sn';
    }
}
