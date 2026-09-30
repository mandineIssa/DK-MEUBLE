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
        $path = $this->regenerate($order);

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
        $company = $this->displayCompany(is_array($brand) ? (string) ($brand['name'] ?? '') : '');
        $phone = $this->contactPhone(is_array($contact) ? $contact : []);
        $email = trim(is_array($contact) ? (string) ($contact['email'] ?? '') : '');
        $address = trim(is_array($contact) ? (string) ($contact['address'] ?? '') : '');
        if ($phone === '') {
            $phone = '+221 77 890 43 22';
        }
        if ($email === '') {
            $email = 'admin@dkhometech.sn';
        }
        if ($address === '') {
            $address = 'Dakar, Parcelle Unité 21';
        }
        $phone = $this->formatDisplayPhone($phone);

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
        $dompdf = new \Dompdf\Dompdf([
            'isRemoteEnabled' => false,
            'defaultFont' => 'DejaVu Sans',
        ]);
        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return $dompdf->output();
    }

    private function html(Order $order, string $company, string $phone, string $email, string $address): string
    {
        $fmt = fn (int|float $n) => number_format((float) $n, 0, ',', ' ').' FCFA';
        $isHome = $order->delivery_method === 'domicile';
        $place = $isHome
            ? ($order->deliveryZone->zone_name ?? '')
            : ($order->showroom->name ?? '');
        $deliveryLine = ($isHome ? 'Livraison à domicile' : 'Retrait en magasin')
            .($place !== '' ? ' — '.$place : '');

        $lines = [];
        $n = 1;
        foreach ($order->items as $item) {
            $lines[] = [
                'n' => $n,
                'name' => (string) $item->product_name,
                'qty' => (int) $item->quantity,
                'unit' => $fmt((int) $item->unit_price),
                'subtotal' => $fmt((int) $item->subtotal),
            ];
            $n++;
        }

        $status = (string) $order->order_status;
        $paymentStatus = (string) $order->payment_status;

        return view('pdf.order-receipt', [
            'company' => $company,
            'phone' => $phone,
            'email' => $email,
            'address' => $address,
            'reference' => (string) $order->reference,
            'dateLabel' => optional($order->created_at)->timezone(config('app.timezone'))->format('d/m/Y H:i') ?? '',
            'customerName' => (string) $order->customer_name,
            'customerPhone' => (string) $order->phone,
            'deliveryLine' => $deliveryLine,
            'deliveryAddress' => (string) ($order->address ?? ''),
            'statusLabel' => $this->statusLabel($status),
            'statusStyle' => $this->statusStyle($status),
            'paymentLabel' => $this->paymentLabel((string) $order->payment_method),
            'paymentStatusLabel' => $this->statusLabel($paymentStatus),
            'lines' => $lines,
            'subtotal' => $fmt((int) $order->subtotal),
            'deliveryFee' => $fmt((int) $order->delivery_fee),
            'total' => $fmt((int) $order->total),
            'icons' => ReceiptArtwork::all(),
        ])->render();
    }

    private function formatDisplayPhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';
        if (str_starts_with($digits, '221') && strlen($digits) >= 12) {
            $digits = substr($digits, -9);
        }
        if (strlen($digits) === 9) {
            return '+221 '.substr($digits, 0, 2).' '.substr($digits, 2, 3).' '.substr($digits, 5, 2).' '.substr($digits, 7, 2);
        }

        return $phone;
    }

    private function displayCompany(string $name): string
    {
        $name = trim($name);
        if ($name === '' || stripos($name, 'meuble') !== false) {
            return 'DK HOMETECH';
        }

        return $name;
    }

    /**
     * @param  array<string, mixed>  $contact
     */
    private function contactPhone(array $contact): string
    {
        $display = trim((string) ($contact['phone_display'] ?? ''));
        if ($display !== '') {
            return $display;
        }
        $tel = trim((string) ($contact['phone_tel'] ?? $contact['phone'] ?? ''));
        if ($tel !== '') {
            return $tel;
        }
        $phones = $contact['phones'] ?? '';
        if (is_array($phones)) {
            return trim((string) ($phones[0] ?? ''));
        }
        $first = trim((string) strtok((string) $phones, ",\n"));

        return $first;
    }

    private function paymentLabel(string $method): string
    {
        $methods = CheckoutSettings::get()['payment_methods'] ?? [];
        foreach ($methods as $row) {
            if (($row['key'] ?? '') === $method && ! empty($row['label'])) {
                return (string) $row['label'];
            }
        }

        return $this->statusLabel($method);
    }

    private function statusLabel(string $value): string
    {
        return match ($value) {
            'en_attente' => 'En attente',
            'confirmee' => 'Confirmée',
            'en_preparation' => 'En préparation',
            'expediee' => 'Expédiée',
            'livree' => 'Livrée',
            'annulee' => 'Annulée',
            'paye', 'paid' => 'Payé',
            'echoue', 'failed' => 'Échoué',
            'cash' => 'Paiement à la livraison',
            'wave' => 'Wave',
            'orange_money' => 'Orange Money',
            'carte' => 'Carte bancaire',
            'virement' => 'Virement',
            default => $value === '' ? '—' : ucfirst(str_replace('_', ' ', $value)),
        };
    }

    private function statusStyle(string $status): string
    {
        return match ($status) {
            'confirmee', 'livree', 'paye', 'paid' => 'background:#e8f6ee;color:#157347;',
            'annulee', 'echoue', 'failed' => 'background:#fdecec;color:#b42318;',
            'en_preparation', 'expediee' => 'background:#e8f1fb;color:#1d4e89;',
            default => 'background:#fff4e8;color:#c05621;',
        };
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
            'Votre achat, notre engagement',
            'N° reçu : '.$order->reference,
            'Date : '.optional($order->created_at)->format('d/m/Y H:i'),
            'Statut : '.$this->statusLabel((string) $order->order_status),
            'Paiement : '.$this->paymentLabel((string) $order->payment_method).' — '.$this->statusLabel((string) $order->payment_status),
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
        $lines[] = 'Merci pour votre confiance. Votre commande est bien enregistree.';
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
