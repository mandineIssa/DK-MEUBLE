<?php

namespace App\Services\Ai;

use App\Models\AiLog;
use App\Models\Setting;
use Illuminate\Support\Facades\Http;

class AiClient
{
    public function configured(): bool
    {
        return $this->enabled() && $this->apiKey() !== '';
    }

    public function enabled(): bool
    {
        $stored = $this->stored();
        if (array_key_exists('enabled', $stored)) {
            return (bool) $stored['enabled'];
        }

        return (bool) config('ai.enabled');
    }

    public function assistantEnabled(): bool
    {
        $stored = $this->stored();
        if (array_key_exists('assistant_enabled', $stored)) {
            return (bool) $stored['assistant_enabled'];
        }

        return (bool) config('ai.assistant_enabled', true);
    }

    public function model(): string
    {
        $stored = trim((string) ($this->stored()['model'] ?? ''));

        return $stored !== '' ? $stored : (string) config('ai.model');
    }

    public function provider(): string
    {
        $stored = trim((string) ($this->stored()['provider'] ?? ''));

        return $stored !== '' ? $stored : (string) config('ai.provider');
    }

    public function baseUrl(): string
    {
        $stored = trim((string) ($this->stored()['base_url'] ?? ''));
        $url = $stored !== '' ? $stored : (string) config('ai.base_url');

        return rtrim($url, '/');
    }

    public function timeout(): int
    {
        $stored = $this->stored();
        $value = array_key_exists('timeout', $stored) ? (int) $stored['timeout'] : (int) config('ai.timeout');

        return max(3, min(60, $value));
    }

    public function retries(): int
    {
        $stored = $this->stored();
        $value = array_key_exists('retries', $stored) ? (int) $stored['retries'] : (int) config('ai.retries');

        return max(0, min(3, $value));
    }

    public function systemPrompt(): string
    {
        return trim((string) ($this->stored()['system_prompt'] ?? ''));
    }

    /** @return array<string, mixed> */
    public function publicStatus(): array
    {
        return [
            'assistant_enabled' => $this->assistantEnabled(),
            'provider_configured' => $this->configured(),
            'provider' => $this->provider(),
            'model' => $this->configured() ? $this->model() : null,
        ];
    }

    /** @return array<string, mixed> */
    public function adminStatus(): array
    {
        return [
            'enabled' => $this->enabled(),
            'assistant_enabled' => $this->assistantEnabled(),
            'provider' => $this->provider(),
            'model' => $this->model(),
            'api_key_configured' => $this->apiKey() !== '',
            'base_url' => $this->baseUrl(),
            'timeout' => $this->timeout(),
            'retries' => $this->retries(),
            'system_prompt' => $this->systemPrompt(),
        ];
    }

    /** @param array<string, mixed> $data */
    public function saveSettings(array $data): void
    {
        $current = $this->stored();
        foreach (['enabled', 'assistant_enabled', 'provider', 'model', 'base_url', 'timeout', 'retries', 'system_prompt'] as $key) {
            if (array_key_exists($key, $data)) {
                $current[$key] = $data[$key];
            }
        }
        Setting::query()->updateOrCreate(['key' => 'ai'], ['value' => $current]);
    }

    public function complete(string $kind, string $system, string $user): ?string
    {
        if (! $this->configured()) {
            $this->log($kind, 'skipped', 0, 'Aucun fournisseur configuré');

            return null;
        }

        $started = microtime(true);
        $attempts = $this->retries() + 1;
        $lastError = 'Erreur fournisseur';

        for ($i = 0; $i < $attempts; $i++) {
            try {
                $response = Http::timeout($this->timeout())
                    ->withToken($this->apiKey())
                    ->acceptJson()
                    ->post($this->baseUrl().'/chat/completions', [
                        'model' => $this->model(),
                        'temperature' => 0.2,
                        'messages' => [
                            ['role' => 'system', 'content' => $system],
                            ['role' => 'user', 'content' => $user],
                        ],
                    ]);

                if (! $response->successful()) {
                    $lastError = 'HTTP '.$response->status();
                    continue;
                }

                $text = trim((string) data_get($response->json(), 'choices.0.message.content', ''));
                $this->log($kind, $text !== '' ? 'ok' : 'empty', $this->ms($started), $text === '' ? 'Réponse vide' : null);

                return $text !== '' ? $text : null;
            } catch (\Throwable $e) {
                $lastError = mb_substr($e->getMessage(), 0, 180);
            }
        }

        $this->log($kind, 'error', $this->ms($started), $lastError);

        return null;
    }

    private function apiKey(): string
    {
        return trim((string) config('ai.api_key'));
    }

    /** @return array<string, mixed> */
    private function stored(): array
    {
        $value = Setting::query()->where('key', 'ai')->value('value');

        return is_array($value) ? $value : [];
    }

    private function log(string $kind, string $status, int $latency, ?string $message): void
    {
        try {
            AiLog::query()->create([
                'kind' => $kind,
                'status' => $status,
                'latency_ms' => $latency,
                'message' => $message,
            ]);
        } catch (\Throwable) {
            // La boutique ne doit pas échouer si le journal IA est indisponible.
        }
    }

    private function ms(float $started): int
    {
        return (int) round((microtime(true) - $started) * 1000);
    }
}
