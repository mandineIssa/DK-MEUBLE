<?php

return [
    'enabled' => env('AI_ENABLED', true),
    'provider' => env('AI_PROVIDER', 'openai'),
    'api_key' => env('AI_API_KEY'),
    'base_url' => rtrim((string) env('AI_BASE_URL', 'https://api.openai.com/v1'), '/'),
    'model' => env('AI_MODEL', 'gpt-4o-mini'),
    'timeout' => (int) env('AI_TIMEOUT', 12),
    'retries' => (int) env('AI_MAX_RETRIES', 1),
    'assistant_enabled' => env('AI_ASSISTANT_ENABLED', true),
];
