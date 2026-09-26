<?php

namespace App\Services;

use App\Models\PageView;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AnalyticsService
{
    public function track(Request $request, array $payload): PageView
    {
        $path = $this->normalizePath((string) ($payload['path'] ?? '/'));
        $title = isset($payload['title']) ? Str::limit((string) $payload['title'], 250) : null;
        $referrer = isset($payload['referrer']) ? Str::limit((string) $payload['referrer'], 990) : null;
        $utmSource = $this->nullableStr($payload['utm_source'] ?? null, 120);
        $utmMedium = $this->nullableStr($payload['utm_medium'] ?? null, 120);
        $utmCampaign = $this->nullableStr($payload['utm_campaign'] ?? null, 160);
        $sessionId = $this->idOrNew($payload['session_id'] ?? null);
        $visitorId = $this->idOrNew($payload['visitor_id'] ?? null);
        $ua = Str::limit((string) $request->userAgent(), 490);
        $device = $this->detectDevice($ua, $payload['device'] ?? null);
        $source = $this->resolveSource($referrer, $utmSource, $utmMedium);

        return PageView::query()->create([
            'path' => $path,
            'title' => $title,
            'referrer' => $referrer,
            'source' => $source,
            'utm_source' => $utmSource,
            'utm_medium' => $utmMedium,
            'utm_campaign' => $utmCampaign,
            'session_id' => $sessionId,
            'visitor_id' => $visitorId,
            'device' => $device,
            'user_agent' => $ua,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function stats(?Carbon $from = null, ?Carbon $to = null): array
    {
        $to = ($to ?? now())->copy()->endOfDay();
        $from = ($from ?? now()->subDays(29))->copy()->startOfDay();

        $base = PageView::query()->whereBetween('created_at', [$from, $to]);

        $pageviews = (clone $base)->count();
        $visitors = (clone $base)->distinct('visitor_id')->count('visitor_id');
        $sessions = (clone $base)->distinct('session_id')->count('session_id');

        $todayStart = now()->startOfDay();
        $yesterdayStart = now()->subDay()->startOfDay();
        $monthStart = now()->startOfMonth();

        $today = PageView::query()->where('created_at', '>=', $todayStart)->count();
        $yesterday = PageView::query()
            ->whereBetween('created_at', [$yesterdayStart, $todayStart->copy()->subSecond()])
            ->count();
        $thisMonth = PageView::query()->where('created_at', '>=', $monthStart)->count();
        $uniqueToday = PageView::query()
            ->where('created_at', '>=', $todayStart)
            ->distinct('visitor_id')
            ->count('visitor_id');

        $daily = $this->dailySeries($from, $to);
        $monthly = $this->monthlySeries(12);
        $topPages = $this->topPages($from, $to, 15);
        $sources = $this->breakdown($from, $to, 'source', $pageviews);
        $devices = $this->breakdown($from, $to, 'device', $pageviews);

        $recent = PageView::query()
            ->latest('id')
            ->limit(25)
            ->get(['id', 'path', 'title', 'source', 'device', 'created_at'])
            ->map(fn (PageView $v) => [
                'id' => $v->id,
                'path' => $v->path,
                'title' => $v->title,
                'source' => $v->source,
                'device' => $v->device,
                'created_at' => $v->created_at?->toIso8601String(),
            ])
            ->all();

        return [
            'range' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
            'summary' => [
                'pageviews' => $pageviews,
                'unique_visitors' => $visitors,
                'sessions' => $sessions,
                'today' => $today,
                'yesterday' => $yesterday,
                'this_month' => $thisMonth,
                'unique_today' => $uniqueToday,
                'avg_per_day' => max(1, $from->diffInDays($to) + 1) > 0
                    ? round($pageviews / max(1, $from->diffInDays($to) + 1), 1)
                    : 0,
            ],
            'daily' => $daily,
            'monthly' => $monthly,
            'top_pages' => $topPages,
            'sources' => $sources,
            'devices' => $devices,
            'recent' => $recent,
        ];
    }

    /**
     * Remplit un historique réaliste si la table est vide (premier lancement).
     */
    public function seedDemoIfEmpty(): int
    {
        if (PageView::query()->exists()) {
            return 0;
        }

        $paths = [
            ['/', 'Accueil'],
            ['/produits', 'Produits'],
            ['/categories', 'Catégories'],
            ['/categorie/electromenager', 'Électroménager'],
            ['/categorie/refrigerateurs', 'Réfrigérateurs'],
            ['/categorie/splits-climatiseur', 'Climatiseurs'],
            ['/promo', 'Promotions'],
            ['/services', 'Services'],
            ['/contact', 'Contact'],
            ['/showrooms', 'Showrooms'],
        ];
        $sources = ['direct', 'google', 'facebook', 'whatsapp', 'instagram', 'referral'];
        $devices = ['desktop', 'mobile', 'mobile', 'tablet'];
        $created = 0;

        for ($d = 89; $d >= 0; $d--) {
            $day = now()->subDays($d)->setTime(rand(8, 21), rand(0, 59));
            $count = rand(8, 45);
            for ($i = 0; $i < $count; $i++) {
                $p = $paths[array_rand($paths)];
                $visitor = 'demo_'.Str::lower(Str::random(10));
                $view = new PageView([
                    'path' => $p[0],
                    'title' => $p[1],
                    'referrer' => null,
                    'source' => $sources[array_rand($sources)],
                    'session_id' => 'demo_'.Str::lower(Str::random(12)),
                    'visitor_id' => $visitor,
                    'device' => $devices[array_rand($devices)],
                    'user_agent' => 'DemoBot',
                ]);
                $view->created_at = $day->copy()->addMinutes(rand(0, 500));
                $view->updated_at = $view->created_at;
                $view->save();
                $created++;
            }
        }

        return $created;
    }

    protected function dailySeries(Carbon $from, Carbon $to): array
    {
        $rows = PageView::query()
            ->select(DB::raw('DATE(created_at) as day'), DB::raw('COUNT(*) as views'), DB::raw('COUNT(DISTINCT visitor_id) as visitors'))
            ->whereBetween('created_at', [$from, $to])
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->keyBy('day');

        $out = [];
        $cursor = $from->copy();
        while ($cursor->lte($to)) {
            $key = $cursor->toDateString();
            $row = $rows->get($key);
            $out[] = [
                'date' => $key,
                'label' => $cursor->format('d/m'),
                'views' => (int) ($row->views ?? 0),
                'visitors' => (int) ($row->visitors ?? 0),
            ];
            $cursor->addDay();
        }

        return $out;
    }

    protected function monthlySeries(int $months = 12): array
    {
        $from = now()->subMonths($months - 1)->startOfMonth();
        $driver = DB::connection()->getDriverName();
        $ymExpr = $driver === 'sqlite'
            ? "strftime('%Y-%m', created_at)"
            : "DATE_FORMAT(created_at, '%Y-%m')";

        $rows = PageView::query()
            ->select(DB::raw("{$ymExpr} as ym"), DB::raw('COUNT(*) as views'), DB::raw('COUNT(DISTINCT visitor_id) as visitors'))
            ->where('created_at', '>=', $from)
            ->groupBy('ym')
            ->orderBy('ym')
            ->get()
            ->keyBy('ym');

        $labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        $out = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $m = now()->subMonths($i);
            $key = $m->format('Y-m');
            $row = $rows->get($key);
            $out[] = [
                'month' => $key,
                'label' => $labels[(int) $m->format('n') - 1],
                'views' => (int) ($row->views ?? 0),
                'visitors' => (int) ($row->visitors ?? 0),
            ];
        }

        return $out;
    }

    protected function topPages(Carbon $from, Carbon $to, int $limit = 15): array
    {
        return PageView::query()
            ->select('path', DB::raw('COUNT(*) as views'), DB::raw('MAX(title) as title'))
            ->whereBetween('created_at', [$from, $to])
            ->groupBy('path')
            ->orderByDesc('views')
            ->limit($limit)
            ->get()
            ->map(fn ($r) => [
                'path' => $r->path,
                'title' => $r->title,
                'views' => (int) $r->views,
            ])
            ->all();
    }

    protected function breakdown(Carbon $from, Carbon $to, string $column, int $total): array
    {
        $rows = PageView::query()
            ->select($column, DB::raw('COUNT(*) as views'))
            ->whereBetween('created_at', [$from, $to])
            ->groupBy($column)
            ->orderByDesc('views')
            ->get();

        return $rows->map(function ($r) use ($column, $total) {
            $val = $r->{$column} ?: 'inconnu';

            return [
                'key' => $val,
                'label' => $this->labelFor($column, $val),
                'views' => (int) $r->views,
                'pct' => $total > 0 ? round(((int) $r->views / $total) * 100, 1) : 0,
            ];
        })->all();
    }

    protected function labelFor(string $column, string $val): string
    {
        if ($column === 'source') {
            return match ($val) {
                'direct' => 'Accès direct',
                'google' => 'Google',
                'facebook' => 'Facebook',
                'instagram' => 'Instagram',
                'whatsapp' => 'WhatsApp',
                'referral' => 'Sites tiers',
                default => ucfirst($val),
            };
        }
        if ($column === 'device') {
            return match ($val) {
                'mobile' => 'Mobile',
                'tablet' => 'Tablette',
                'desktop' => 'Ordinateur',
                default => ucfirst($val),
            };
        }

        return $val;
    }

    protected function normalizePath(string $path): string
    {
        $path = trim($path);
        if ($path === '') {
            return '/';
        }
        if (! str_starts_with($path, '/')) {
            $path = '/'.$path;
        }
        $path = strtok($path, '?') ?: '/';

        return Str::limit($path, 490);
    }

    protected function resolveSource(?string $referrer, ?string $utmSource, ?string $utmMedium): string
    {
        $utm = Str::lower((string) $utmSource);
        if ($utm !== '') {
            if (str_contains($utm, 'google')) {
                return 'google';
            }
            if (str_contains($utm, 'facebook') || $utm === 'fb') {
                return 'facebook';
            }
            if (str_contains($utm, 'instagram') || $utm === 'ig') {
                return 'instagram';
            }
            if (str_contains($utm, 'whatsapp') || $utm === 'wa') {
                return 'whatsapp';
            }

            return Str::limit($utm, 60);
        }

        $medium = Str::lower((string) $utmMedium);
        if ($medium === 'cpc' || $medium === 'paid') {
            return 'paid';
        }

        if (! $referrer) {
            return 'direct';
        }

        $host = Str::lower((string) parse_url($referrer, PHP_URL_HOST));
        if ($host === '' || str_contains($host, 'localhost') || str_contains($host, 'dk-hometech') || str_contains($host, '127.0.0.1')) {
            return 'direct';
        }
        if (str_contains($host, 'google.') || str_contains($host, 'bing.') || str_contains($host, 'yahoo.')) {
            return 'google';
        }
        if (str_contains($host, 'facebook.') || str_contains($host, 'fb.')) {
            return 'facebook';
        }
        if (str_contains($host, 'instagram.')) {
            return 'instagram';
        }
        if (str_contains($host, 'whatsapp.') || str_contains($host, 'wa.me')) {
            return 'whatsapp';
        }

        return 'referral';
    }

    protected function detectDevice(string $ua, mixed $hint): string
    {
        $hint = Str::lower((string) $hint);
        if (in_array($hint, ['desktop', 'mobile', 'tablet'], true)) {
            return $hint;
        }
        $ua = Str::lower($ua);
        if (str_contains($ua, 'ipad') || str_contains($ua, 'tablet')) {
            return 'tablet';
        }
        if (str_contains($ua, 'mobile') || str_contains($ua, 'android') || str_contains($ua, 'iphone')) {
            return 'mobile';
        }

        return 'desktop';
    }

    protected function idOrNew(mixed $value): string
    {
        $v = preg_replace('/[^a-zA-Z0-9_\-]/', '', (string) $value) ?: '';
        if (strlen($v) >= 8 && strlen($v) <= 64) {
            return $v;
        }

        return Str::lower(Str::random(24));
    }

    protected function nullableStr(mixed $value, int $max): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return Str::limit((string) $value, $max);
    }
}
