<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AnalyticsController extends Controller
{
    public function visits(Request $request, AnalyticsService $analytics): JsonResponse
    {
        $analytics->seedDemoIfEmpty();

        $period = (string) $request->query('period', '30d');
        [$from, $to] = $this->rangeFromPeriod($period, $request);

        return response()->json($analytics->stats($from, $to));
    }

    public function export(Request $request, AnalyticsService $analytics): StreamedResponse
    {
        $analytics->seedDemoIfEmpty();
        $period = (string) $request->query('period', '30d');
        [$from, $to] = $this->rangeFromPeriod($period, $request);
        $stats = $analytics->stats($from, $to);

        return response()->streamDownload(function () use ($stats) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['date', 'views', 'visitors']);
            foreach ($stats['daily'] as $row) {
                fputcsv($out, [$row['date'], $row['views'], $row['visitors']]);
            }
            fclose($out);
        }, 'visites-'.$stats['range']['from'].'_'.$stats['range']['to'].'.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    protected function rangeFromPeriod(string $period, Request $request): array
    {
        $to = $request->query('to')
            ? Carbon::parse((string) $request->query('to'))->endOfDay()
            : now()->endOfDay();

        if ($request->query('from')) {
            $from = Carbon::parse((string) $request->query('from'))->startOfDay();

            return [$from, $to];
        }

        $from = match ($period) {
            '7d' => now()->subDays(6)->startOfDay(),
            '90d' => now()->subDays(89)->startOfDay(),
            '12m' => now()->subMonths(11)->startOfMonth(),
            default => now()->subDays(29)->startOfDay(),
        };

        return [$from, $to];
    }
}
