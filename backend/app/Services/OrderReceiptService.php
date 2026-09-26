<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Setting;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class OrderReceiptService
{
    public function relativePath(Order $order): string
    {
        return 'receipts/'.$order->reference.'.pdf';
    }

    public function absolutePath(Order $order): string
    {
        return Storage::disk('local')->path($this->relativePath($order));
    }

    public function exists(Order $order): bool
    {
        return Storage::disk('local')->exists($this->relativePath($order));
    }

    public function ensure(Order $order): string
    {
        if (! $this->exists($order)) {
            return $this->generate($order);
        }

        return $this->relativePath($order);
    }

    public function regenerate(Order $order): string
    {
        return $this->generate($order);
    }

    public function download(Order $order): StreamedResponse
    {
        $order->loadMissing(['items', 'deliveryZone', 'showroom']);
        $path = $this->ensure($order);

        return Storage::disk('local')->download(
            $path,
            'recu-'.$order->reference.'.pdf',
            ['Content-Type' => 'application/pdf']
        );
    }

    private function generate(Order $order): string
    {
        $order->loadMissing(['items', 'deliveryZone', 'showroom']);

        $brand = Setting::query()->where('key', 'brand')->value('value');
        $contact = Setting::query()->where('key', 'contact')->value('value');
        $company = is_array($brand) ? ($brand['name'] ?? 'DK HOMETECH') : 'DK HOMETECH';
        $phone = is_array($contact) ? ($contact['phone'] ?? '') : '';
        $email = is_array($contact) ? ($contact['email'] ?? '') : '';
        $address = is_array($contact) ? ($contact['address'] ?? '') : '';

        $pdf = class_exists(\Dompdf\Dompdf::class)
            ? $this->renderWithDompdf($order, $company, $phone, $email, $address)
            : $this->renderSimplePdf($order, $company, $phone, $email, $address);

        $relative = $this->relativePath($order);
        Storage::disk('local')->put($relative, $pdf);

        return $relative;
    }

    private function renderWithDompdf(Order $order, string $company, string $phone, string $email, string $address): string
    {
        $html = $this->html($order, $company, $phone, $email, $address);
        $dompdf = new \Dompdf\Dompdf(['isRemoteEnabled' => false]);
        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return $dompdf->output();
    }

    private function html(Order $order, string $company, string $phone, string $email, string $address): string
    {
        $fmt = fn (int|float $n) => number_format((float) $n, 0, ',', ' ').' FCFA';
        $deliveryLabel = $order->delivery_method === 'domicile'
            ? 'Livraison à domicile'.($order->deliveryZone ? ' — '.$order->deliveryZone->zone_name : '')
            : 'Retrait showroom'.($order->showroom ? ' — '.$order->showroom->name : '');

        $rows = '';
        foreach ($order->items as $item) {
            $rows .= '<tr>'
                .'<td>'.e($item->product_name).'</td>'
                .'<td style="text-align:center">'.(int) $item->quantity.'</td>'
                .'<td style="text-align:right">'.$fmt((int) $item->unit_price).'</td>'
                .'<td style="text-align:right">'.$fmt((int) $item->subtotal).'</td>'
                .'</tr>';
        }

        return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>
            body{font-family:DejaVu Sans,sans-serif;font-size:12px;color:#111;margin:32px}
            h1{font-size:22px;margin:0 0 4px;color:#e85d04}
            h2{font-size:16px;margin:24px 0 8px}
            .muted{color:#666}
            table{width:100%;border-collapse:collapse;margin-top:12px}
            th,td{border-bottom:1px solid #ddd;padding:8px 4px;text-align:left}
            th{background:#f7f7f7;font-size:11px;text-transform:uppercase}
            .tot{font-size:14px;font-weight:bold}
            .box{border:1px solid #eee;padding:12px;margin-top:12px}
        </style></head><body>
            <h1>'.e($company).'</h1>
            <p class="muted">'.e($address).'<br>'.e($phone).($email ? ' · '.e($email) : '').'</p>
            <h2>Reçu de commande</h2>
            <div class="box">
                <p><strong>Référence :</strong> '.e($order->reference).'</p>
                <p><strong>Date :</strong> '.e(optional($order->created_at)->timezone(config('app.timezone'))->format('d/m/Y H:i')).'</p>
                <p><strong>Statut :</strong> '.e($order->order_status).' · Paiement : '.e($order->payment_method).' ('.e($order->payment_status).')</p>
                <p><strong>Client :</strong> '.e($order->customer_name).' · '.e($order->phone).($order->email ? ' · '.e($order->email) : '').'</p>
                <p><strong>Livraison :</strong> '.e($deliveryLabel).($order->address ? '<br>'.e($order->address) : '').'</p>
            </div>
            <table>
                <thead><tr><th>Article</th><th>Qté</th><th>P.U.</th><th>Sous-total</th></tr></thead>
                <tbody>'.$rows.'</tbody>
            </table>
            <p style="text-align:right;margin-top:16px">Sous-total : '.$fmt((int) $order->subtotal).'</p>
            <p style="text-align:right">Livraison : '.$fmt((int) $order->delivery_fee).'</p>
            <p class="tot" style="text-align:right">Total : '.$fmt((int) $order->total).'</p>
            <p class="muted" style="margin-top:32px">Document généré automatiquement — '.e($company).'</p>
        </body></html>';
    }

    /**
     * Générateur PDF minimal (sans dépendance) — utilisé si Dompdf n'est pas installé.
     */
    private function renderSimplePdf(Order $order, string $company, string $phone, string $email, string $address): string
    {
        $fmt = fn (int $n) => number_format($n, 0, ',', ' ').' FCFA';
        $deliveryLabel = $order->delivery_method === 'domicile'
            ? 'Livraison a domicile'.($order->deliveryZone ? ' - '.$order->deliveryZone->zone_name : '')
            : 'Retrait showroom'.($order->showroom ? ' - '.$order->showroom->name : '');

        $lines = [
            $company,
            trim($address),
            trim(implode(' | ', array_filter([$phone, $email]))),
            '',
            'RECU DE COMMANDE',
            'Reference : '.$order->reference,
            'Date : '.optional($order->created_at)->format('d/m/Y H:i'),
            'Statut : '.$order->order_status.' | Paiement : '.$order->payment_method.' ('.$order->payment_status.')',
            'Client : '.$order->customer_name.' | '.$order->phone.($order->email ? ' | '.$order->email : ''),
            'Livraison : '.$deliveryLabel,
        ];
        if ($order->address) {
            $lines[] = 'Adresse : '.$order->address;
        }
        $lines[] = '';
        $lines[] = str_pad('Article', 36).str_pad('Qte', 6, ' ', STR_PAD_LEFT).str_pad('PU', 14, ' ', STR_PAD_LEFT).str_pad('Total', 14, ' ', STR_PAD_LEFT);
        $lines[] = str_repeat('-', 70);

        foreach ($order->items as $item) {
            $name = mb_substr((string) $item->product_name, 0, 34);
            $lines[] = str_pad($this->toPdfText($name), 36)
                .str_pad((string) (int) $item->quantity, 6, ' ', STR_PAD_LEFT)
                .str_pad($fmt((int) $item->unit_price), 14, ' ', STR_PAD_LEFT)
                .str_pad($fmt((int) $item->subtotal), 14, ' ', STR_PAD_LEFT);
        }

        $lines[] = str_repeat('-', 70);
        $lines[] = str_pad('Sous-total', 56).str_pad($fmt((int) $order->subtotal), 14, ' ', STR_PAD_LEFT);
        $lines[] = str_pad('Livraison', 56).str_pad($fmt((int) $order->delivery_fee), 14, ' ', STR_PAD_LEFT);
        $lines[] = str_pad('TOTAL', 56).str_pad($fmt((int) $order->total), 14, ' ', STR_PAD_LEFT);
        $lines[] = '';
        $lines[] = 'Document genere automatiquement — '.$company;

        return $this->buildPdfFromLines(array_values(array_filter($lines, fn ($l) => $l !== null)));
    }

    private function toPdfText(string $text): string
    {
        $converted = @iconv('UTF-8', 'Windows-1252//TRANSLIT//IGNORE', $text);
        if ($converted === false) {
            $converted = preg_replace('/[^\x20-\x7E]/', '?', $text) ?? $text;
        }

        return $converted;
    }

    private function buildPdfFromLines(array $lines): string
    {
        $yStart = 800;
        $leading = 14;
        $content = "BT /F1 11 Tf 40 {$yStart} Td\n";
        $first = true;
        foreach ($lines as $line) {
            $safe = $this->toPdfText((string) $line);
            $safe = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $safe);
            if ($first) {
                $content .= "({$safe}) Tj\n";
                $first = false;
            } else {
                $content .= "0 -{$leading} Td ({$safe}) Tj\n";
            }
        }
        $content .= "ET";

        $objects = [];
        $objects[] = '<< /Type /Catalog /Pages 2 0 R >>';
        $objects[] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
        $objects[] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>';
        $objects[] = '<< /Length '.strlen($content)." >>\nstream\n{$content}\nendstream";
        $objects[] = '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>';

        $pdf = "%PDF-1.4\n";
        $offsets = [0];
        foreach ($objects as $i => $obj) {
            $offsets[$i + 1] = strlen($pdf);
            $pdf .= ($i + 1)." 0 obj\n{$obj}\nendobj\n";
        }
        $xref = strlen($pdf);
        $pdf .= 'xref\n0 '.(count($objects) + 1)."\n";
        $pdf .= "0000000000 65535 f \n";
        for ($i = 1; $i <= count($objects); $i++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
        }
        $pdf .= 'trailer << /Size '.(count($objects) + 1).' /Root 1 0 R >>\n';
        $pdf .= "startxref\n{$xref}\n%%EOF";

        return $pdf;
    }
}
