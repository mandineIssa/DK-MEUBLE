<?php

$primary = trim((string) env('CORS_ALLOWED_ORIGIN', 'http://localhost:3000'));
$extra = (string) env('CORS_ALLOWED_ORIGINS_EXTRA', '');

$origins = array_values(array_unique(array_filter(array_map(
    'trim',
    array_merge(
        // Accepte encore une valeur unique OU une liste séparée par des virgules
        explode(',', $primary),
        explode(',', $extra)
    )
))));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Liste PHP (plusieurs entrées OK). Laravel n'en renvoie qu'UNE
    // — celle qui correspond à l'en-tête Origin de la requête.
    'allowed_origins' => $origins,

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['X-Cart-Token'],

    'max_age' => 0,

    // Obligatoire : cookie de session Sanctum front ↔ API
    'supports_credentials' => true,
];
