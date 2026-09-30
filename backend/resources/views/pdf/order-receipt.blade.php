<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Reçu {{ $reference }}</title>
    <style>
        @page { margin: 34mm 11mm 18mm 11mm; }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            color: #16324f;
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            line-height: 1.35;
        }
        table { width: 100%; border-collapse: collapse; }
        img { border: 0; }
        .page-header {
            position: fixed;
            top: -28mm;
            left: 0;
            right: 0;
            height: 26mm;
        }
        .page-footer {
            position: fixed;
            bottom: -13mm;
            left: 0;
            right: 0;
            height: 12mm;
        }
        .name { font-size: 16px; font-weight: bold; color: #102a4c; letter-spacing: 0.3px; }
        .name span { color: #f68b1e; }
        .tag { font-size: 7.5px; letter-spacing: 0.8px; color: #5c7190; font-weight: bold; }
        .slogan { font-size: 9px; color: #7a8ba3; font-style: italic; }
        .meta { font-size: 8.5px; color: #3d5270; line-height: 1.45; }
        .perk { font-size: 7.5px; color: #3d5270; line-height: 1.2; }
        .rule { height: 3px; background: #f68b1e; margin-top: 6px; }
        .doc-title { font-size: 18px; font-weight: bold; color: #102a4c; letter-spacing: 0.2px; margin: 0; }
        .doc-sub { font-size: 7.5px; letter-spacing: 0.9px; color: #5c7190; font-weight: bold; margin: 2px 0 0; }
        .ref-box { background: #f7fafc; border: 1px solid #d5e0ec; border-radius: 6px; }
        .ref-label { font-size: 7.5px; letter-spacing: 0.7px; color: #7a8ba3; font-weight: bold; }
        .ref-value { font-size: 12px; font-weight: bold; color: #102a4c; }
        .panel { background: #f4f7fb; border: 1px solid #e4ebf3; border-radius: 6px; }
        .k { font-size: 7.5px; color: #7a8ba3; font-weight: bold; letter-spacing: 0.4px; }
        .v { font-size: 11px; color: #16324f; font-weight: bold; }
        .badge { display: inline-block; padding: 2px 8px; font-size: 10px; font-weight: bold; }
        .items { margin-top: 12px; }
        .items th {
            background: #123a5f;
            color: #ffffff;
            font-size: 8px;
            letter-spacing: 0.5px;
            text-align: left;
            padding: 7px 8px;
        }
        .items td {
            padding: 7px 8px;
            border-bottom: 1px solid #e6edf5;
            font-size: 10px;
            color: #16324f;
            vertical-align: top;
        }
        .num { text-align: center; color: #5c7190; }
        .money { text-align: right; white-space: nowrap; }
        .thanks { background: #f4f7fb; border: 1px solid #e4ebf3; border-radius: 6px; padding: 10px 12px; }
        .thanks h3 { margin: 0 0 3px; font-size: 11px; color: #123a5f; }
        .thanks p { margin: 0; font-size: 9px; color: #4c6280; }
        .sum { border: 1px solid #e4ebf3; border-radius: 6px; }
        .sum td { padding: 5px 8px; font-size: 10px; color: #3d5270; }
        .sum .amount { text-align: right; font-weight: bold; color: #16324f; white-space: nowrap; }
        .total-row td { background: #123a5f; color: #ffffff; font-weight: bold; font-size: 12px; padding: 8px; }
        .total-row .amount { color: #f68b1e; font-size: 13px; text-align: right; }
        .sign-name { font-style: italic; font-size: 14px; color: #123a5f; }
        .sign-role { font-size: 9px; color: #5c7190; }
        .auto {
            background: #f7fafc;
            border: 1px solid #e4ebf3;
            border-radius: 6px;
            padding: 8px 10px;
            font-size: 8px;
            color: #7a8ba3;
        }
        .footer { background: #123a5f; color: #ffffff; }
        .footer td { padding: 6px 10px; font-size: 8px; color: #ffffff; }
        .footer .accent { height: 3px; background: #f68b1e; padding: 0; }
        .keep { page-break-inside: avoid; }
        thead { display: table-header-group; }
        .items tr { page-break-inside: avoid; }
    </style>
</head>
<body>
    <div class="page-header">
        <table>
            <tr>
                <td style="width:42%; vertical-align:middle;">
                    <table>
                        <tr>
                            <td style="width:40px; vertical-align:middle;">
                                <img src="{{ $icons['mark'] }}" width="36" height="36" alt="">
                            </td>
                            <td style="vertical-align:middle;">
                                <div class="name">DK <span>HOMETECH</span></div>
                                <div class="tag">MEUBLES &amp; ÉLECTROMÉNAGER</div>
                                <div class="slogan">Votre confort, notre priorité</div>
                            </td>
                        </tr>
                    </table>
                </td>
                <td style="width:30%; vertical-align:middle;" class="meta">
                    <table>
                        <tr>
                            <td style="width:16px; vertical-align:top;"><img src="{{ $icons['pin'] }}" width="12" height="12" alt=""></td>
                            <td>{{ $address }}</td>
                        </tr>
                        <tr>
                            <td style="vertical-align:top; padding-top:2px;"><img src="{{ $icons['phone'] }}" width="12" height="12" alt=""></td>
                            <td style="padding-top:2px;">{{ $phone }}</td>
                        </tr>
                        <tr>
                            <td style="vertical-align:top; padding-top:2px;"><img src="{{ $icons['mail'] }}" width="12" height="12" alt=""></td>
                            <td style="padding-top:2px;">{{ $email }}</td>
                        </tr>
                    </table>
                </td>
                <td style="width:28%; vertical-align:middle;">
                    <table>
                        <tr>
                            <td style="width:18px; vertical-align:top;"><img src="{{ $icons['truck'] }}" width="14" height="14" alt=""></td>
                            <td class="perk">Livraison partout<br>au Sénégal</td>
                        </tr>
                        <tr>
                            <td style="vertical-align:top; padding-top:3px;"><img src="{{ $icons['shield'] }}" width="14" height="14" alt=""></td>
                            <td class="perk" style="padding-top:3px;">Produits de qualité<br>garantie</td>
                        </tr>
                        <tr>
                            <td style="vertical-align:top; padding-top:3px;"><img src="{{ $icons['headset'] }}" width="14" height="14" alt=""></td>
                            <td class="perk" style="padding-top:3px;">Service client<br>à votre écoute</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        <div class="rule"></div>
    </div>

    <div class="page-footer">
        <table class="footer">
            <tr><td colspan="2" class="accent"></td></tr>
            <tr>
                <td>{{ $address }} &nbsp;&nbsp; {{ $phone }} &nbsp;&nbsp; {{ $email }}</td>
                <td style="text-align:right; font-style:italic;">Meubles · Électroménager · Mobilier de bureau</td>
            </tr>
        </table>
    </div>

    <table class="keep">
        <tr>
            <td style="width:56%; vertical-align:middle;">
                <p class="doc-title">REÇU DE COMMANDE</p>
                <p class="doc-sub">VOTRE ACHAT, NOTRE ENGAGEMENT</p>
            </td>
            <td style="width:44%; vertical-align:middle;">
                <table class="ref-box">
                    <tr>
                        <td style="width:52%; padding:7px 8px; border-right:1px solid #d5e0ec;">
                            <div class="ref-label">N° REÇU</div>
                            <div class="ref-value">{{ $reference }}</div>
                        </td>
                        <td style="padding:7px 8px;">
                            <div class="ref-label">DATE</div>
                            <div class="ref-value" style="font-size:11px;">{{ $dateLabel }}</div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <table class="panel keep" style="margin-top:10px;">
        <tr>
            <td style="width:56%; padding:8px 10px; vertical-align:top; border-right:1px solid #e4ebf3;">
                <table>
                    <tr>
                        <td style="width:18px; vertical-align:top;"><img src="{{ $icons['user'] }}" width="14" height="14" alt=""></td>
                        <td>
                            <div class="k">CLIENT</div>
                            <div class="v">{{ $customerName }}</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="vertical-align:top; padding-top:6px;"><img src="{{ $icons['phone'] }}" width="14" height="14" alt=""></td>
                        <td style="padding-top:6px;">
                            <div class="k">TÉLÉPHONE</div>
                            <div class="v">{{ $customerPhone !== '' ? $customerPhone : '—' }}</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="vertical-align:top; padding-top:6px;"><img src="{{ $icons['box'] }}" width="14" height="14" alt=""></td>
                        <td style="padding-top:6px;">
                            <div class="k">LIVRAISON</div>
                            <div class="v">{{ $deliveryLine }}</div>
                            @if ($deliveryAddress !== '')
                                <div style="font-size:10px; color:#4c6280; font-weight:normal;">{{ $deliveryAddress }}</div>
                            @endif
                        </td>
                    </tr>
                </table>
            </td>
            <td style="width:44%; padding:8px 10px; vertical-align:top;">
                <table>
                    <tr>
                            <td style="width:18px; vertical-align:top;"><img src="{{ $icons['shield'] }}" width="14" height="14" alt=""></td>
                            <td>
                                <div class="k">STATUT</div>
                                <div class="badge" style="{{ $statusStyle }}">&#10003; {{ $statusLabel }}</div>
                            </td>
                    </tr>
                    <tr>
                        <td style="vertical-align:top; padding-top:8px;"><img src="{{ $icons['card'] }}" width="14" height="14" alt=""></td>
                        <td style="padding-top:8px;">
                            <div class="k">PAIEMENT</div>
                            <div class="v" style="font-weight:normal;">{{ $paymentLabel }} — {{ $paymentStatusLabel }}</div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <table class="items">
        <thead>
            <tr>
                <th style="width:8%; text-align:center;">N°</th>
                <th>ARTICLE</th>
                <th style="width:10%; text-align:center;">QTÉ</th>
                <th style="width:18%; text-align:right;">P.U.</th>
                <th style="width:22%; text-align:right;">SOUS-TOTAL</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($lines as $line)
                <tr>
                    <td class="num">{{ $line['n'] }}</td>
                    <td>{{ $line['name'] }}</td>
                    <td class="num">{{ $line['qty'] }}</td>
                    <td class="money">{{ $line['unit'] }}</td>
                    <td class="money">{{ $line['subtotal'] }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="5" style="text-align:center; color:#7a8ba3;">Aucun article sur cette commande.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <table class="keep" style="margin-top:12px;">
        <tr>
            <td style="width:54%; vertical-align:top; padding-right:10px;">
                <div class="thanks">
                    <h3>&#10003; Merci pour votre confiance !</h3>
                    <p>Votre commande est bien enregistrée. Nous vous remercions pour votre achat chez DK HOMETECH.</p>
                </div>
            </td>
            <td style="width:46%; vertical-align:top;">
                <table class="sum">
                    <tr>
                        <td>Sous-total</td>
                        <td class="amount">{{ $subtotal }}</td>
                    </tr>
                    <tr>
                        <td>Livraison</td>
                        <td class="amount">{{ $deliveryFee }}</td>
                    </tr>
                    <tr class="total-row">
                        <td>TOTAL</td>
                        <td class="amount">{{ $total }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <table class="keep" style="margin-top:14px;">
        <tr>
            <td style="width:36%; vertical-align:middle;">
                <div class="sign-name">DK HOMETECH</div>
                <div class="sign-role">Équipe commerciale</div>
            </td>
            <td style="width:28%; vertical-align:middle; text-align:center;">
                <img src="{{ $icons['stamp'] }}" width="78" height="78" alt="">
            </td>
            <td style="width:36%; vertical-align:middle;">
                <div class="auto">
                    Document généré automatiquement<br>
                    — DK HOMETECH
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
