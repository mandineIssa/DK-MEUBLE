<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('CORS_ALLOWED_ORIGIN', 'http://localhost:3000'),
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['X-Cart-Token'],

    'max_age' => 0,

    // Obligatoire : le cookie de session Sanctum doit pouvoir circuler
    // entre le frontend (dkhometech.sn) et l'API (api.dkhometech.sn).
    'supports_credentials' => true,
];
