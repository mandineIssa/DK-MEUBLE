<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Cookies de session Sanctum pour le frontend (localhost:3000)
        $middleware->statefulApi();

        // API JSON : jamais de redirect vers une route web "login" (évite 500 Route [login] not defined)
        $middleware->redirectGuestsTo(function (Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return null;
            }

            return '/compte/connexion';
        });

        // Admin : auth Bearer (pas de cookie CSRF cross-subdomain)
        $middleware->validateCsrfTokens(except: [
            'api/admin',
            'api/admin/*',
            'api/contact',
            'api/quotes',
            'api/newsletter',
            'api/analytics/pageview',
            'api/services/*/request',
            'api/products/search-by-image',
            'api/products/*/reviews',
            'api/auth/request-otp',
            'api/auth/verify-otp',
            'api/cart',
            'api/checkout',
            'api/customer/wishlist',
            'api/customer/wishlist/*',
            'api/customer/orders/*',
            'api/customer/notifications',
            'api/customer/notifications/*',
            'api/customer/notification-preferences',
            'api/customer/content-reports',
            'api/content-reports',
            'api/customer/push-subscriptions',
            'api/customer/product-chats',
            'api/customer/product-chats/*',
        ]);

        $middleware->alias([
            'admin' => \App\Http\Middleware\EnsureAdminUser::class,
            'customer' => \App\Http\Middleware\EnsureCustomer::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => 'Session expirée. Reconnectez-vous.'], 401);
            }
        });

        $exceptions->render(function (\Illuminate\Http\Exceptions\ThrottleRequestsException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                $retry = (int) ceil($e->getHeaders()['Retry-After'] ?? 60);

                return response()->json([
                    'message' => "Trop de tentatives. Réessayez dans environ {$retry} seconde(s).",
                ], 429);
            }
        });
    })->create();
