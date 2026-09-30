<?php

namespace App\Services\Ai;

use App\Models\AiLog;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PageView;
use App\Models\Product;
use App\Models\SearchQuery;
use Illuminate\Support\Facades\DB;

class InsightService
{
    /** @return array<string, mixed> */
    public function dashboard(): array
    {
        $orders = Order::query()->where('order_status', '!=', 'annulee');
        $count = (clone $orders)->count();
        $revenue = (int) (clone $orders)->sum('total');
        $average = $count > 0 ? (int) round($revenue / $count) : 0;

        $sold = OrderItem::query()
            ->select('product_id', 'product_name', DB::raw('SUM(quantity) as qty'))
            ->whereNotNull('product_id')
            ->groupBy('product_id', 'product_name')
            ->orderByDesc('qty')
            ->limit(5)
            ->get();

        $soldIds = OrderItem::query()->whereNotNull('product_id')->distinct()->pluck('product_id');
        $neverSold = Product::query()->published()->whereNotIn('id', $soldIds)->count();
        $lowStock = Product::query()->published()->whereBetween('stock_quantity', [1, 3])->count();

        $views = PageView::query()
            ->select('path', DB::raw('COUNT(*) as views'))
            ->where('path', 'like', '/produits/%')
            ->groupBy('path')
            ->orderByDesc('views')
            ->limit(5)
            ->get();

        $searches = SearchQuery::query()
            ->select('query', DB::raw('COUNT(*) as times'), DB::raw('MIN(results_count) as min_results'))
            ->groupBy('query')
            ->orderByDesc('times')
            ->limit(8)
            ->get();
        $emptySearches = SearchQuery::query()->where('results_count', 0)->count();
        $searchTotal = SearchQuery::query()->count();

        $inactive = Cart::query()
            ->where('updated_at', '<', now()->subDay())
            ->whereHas('items')
            ->with(['items.product.promotions'])
            ->get();
        $inactiveCarts = $inactive->count();
        $inactiveValue = (int) $inactive->sum(function (Cart $cart) {
            return $cart->items->sum(function ($item) {
                $price = $item->product?->effective_price ?? 0;

                return $price * (int) $item->quantity;
            });
        });

        $opportunities = [];
        $frequent = $searches->first(fn ($row) => (int) $row->times >= 5);
        if ($frequent) {
            $opportunities[] = 'La recherche « '.$frequent->query.' » revient '.(int) $frequent->times.' fois.';
        }
        if ($searchTotal < 5 && $count < 3) {
            $opportunities[] = 'Données insuffisantes pour conclure à une tendance commerciale.';
        }
        if ($lowStock > 0) {
            $opportunities[] = $lowStock.' produit(s) ont un stock entre 1 et 3.';
        }

        return [
            'sales' => [
                'revenue' => $revenue,
                'orders' => $count,
                'average_basket' => $average,
                'enough' => $count >= 3,
            ],
            'products' => [
                'most_viewed' => $views,
                'most_sold' => $sold,
                'never_sold' => $neverSold,
                'low_stock' => $lowStock,
            ],
            'search' => [
                'frequent' => $searches,
                'without_result' => $emptySearches,
                'enough' => $searchTotal >= 5,
            ],
            'carts' => [
                'inactive_24h' => $inactiveCarts,
                'inactive_value' => $inactiveValue,
                'note' => $inactiveCarts >= 5
                    ? 'Paniers avec articles non modifiés depuis plus de 24 h. Ce n’est pas une preuve d’abandon.'
                    : 'Données insuffisantes pour conclure à des paniers abandonnés.',
            ],
            'opportunities' => $opportunities,
            'errors' => AiLog::query()->where('status', 'error')->latest()->limit(10)->get(['kind', 'message', 'created_at']),
            'usage' => [
                'calls' => AiLog::query()->count(),
                'errors' => AiLog::query()->where('status', 'error')->count(),
            ],
        ];
    }
}
