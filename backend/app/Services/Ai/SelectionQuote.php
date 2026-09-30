<?php

namespace App\Services\Ai;

use Dompdf\Dompdf;

class SelectionQuote
{
    /** @param array{items: list<array{product: mixed, quantity: int, note: string|null}>, total: int, budget: int|null, message: string} $plan */
    public function pdf(array $plan): string
    {
        $rows = '';
        foreach ($plan['items'] as $item) {
            $product = $item['product'];
            $price = (int) ($product->effective_price ?? 0);
            $qty = (int) $item['quantity'];
            $rows .= '<tr><td>'.e($product->name).'</td><td>'.e((string) ($product->sku ?: '—')).'</td><td>'.$qty.'</td><td>'.number_format($price, 0, ',', ' ').'</td><td>'.number_format($price * $qty, 0, ',', ' ').'</td></tr>';
        }
        $budget = $plan['budget'] !== null ? number_format((int) $plan['budget'], 0, ',', ' ').' FCFA' : 'Non indiqué';
        $html = '<html><head><meta charset="utf-8"><style>body{font-family:DejaVu Sans,sans-serif;font-size:12px;color:#1a1a1a}h1{font-size:18px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:6px;text-align:left}th{background:#1a1a1a;color:#fff}</style></head><body>'
            .'<h1>Estimation DK HOMETECH</h1>'
            .'<p>Document indicatif, établi à partir des prix enregistrés dans le catalogue. Ce n’est pas une facture.</p>'
            .'<p>Budget indiqué : '.$budget.'<br>Total de la sélection : '.number_format((int) $plan['total'], 0, ',', ' ').' FCFA</p>'
            .'<table><thead><tr><th>Produit</th><th>Référence</th><th>Qté</th><th>Prix</th><th>Sous-total</th></tr></thead><tbody>'.$rows.'</tbody></table>'
            .'<p>'.e($plan['message']).'</p></body></html>';

        $dompdf = new Dompdf;
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4');
        $dompdf->render();

        return $dompdf->output();
    }
}
