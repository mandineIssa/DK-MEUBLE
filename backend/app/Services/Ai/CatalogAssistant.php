<?php

namespace App\Services\Ai;

use App\Models\AiConversation;
use App\Models\AiMessage;
use App\Models\Product;
use Illuminate\Support\Str;

class CatalogAssistant
{
    public function __construct(
        private CatalogSearch $catalog,
        private AiClient $client,
    ) {}

    /**
     * @param list<array{role: string, content: string}> $history
     * @return array{session_id: string, reply: string, products: mixed, provider: string}
     */
    public function chat(string $message, ?string $sessionId, ?string $productSlug, ?string $pagePath, array $history = []): array
    {
        $sessionId = $sessionId && preg_match('/^[A-Za-z0-9_-]{8,64}$/', $sessionId) ? $sessionId : (string) Str::uuid();
        $conversation = AiConversation::query()->firstOrCreate(
            ['session_id' => $sessionId],
            ['page_path' => $pagePath]
        );
        if ($productSlug) {
            $productId = Product::query()->published()->where('slug', $productSlug)->value('id');
            if ($productId) {
                $conversation->product_id = $productId;
                $conversation->save();
            }
        }
        AiMessage::query()->create([
            'ai_conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => mb_substr($message, 0, 2000),
        ]);

        $product = $conversation->product_id
            ? Product::query()->published()->with(['category', 'images', 'brand', 'promotions'])->find($conversation->product_id)
            : null;

        $folded = mb_strtolower($message);
        $products = collect();
        $concrete = false;
        $equipment = $this->equipmentRequest($message);
        if ($this->isGreeting($folded)) {
            $reply = "Bonjour 👋 Bienvenue chez DK HOMETECH. Que recherchez-vous aujourd'hui ?";
        } elseif ($equipment) {
            $plan = $this->catalog->plan($equipment);
            $products = collect($plan['items'])->map(fn (array $item) => $item['product'])->values();
            $reply = $this->formatPlan($plan);
            $concrete = true;
        } elseif ($product && preg_match('/similaire|autre modèle|autre modele|équivalent|equivalent/u', $folded)) {
            $products = $this->catalog->recommend($product)['similar'];
            $reply = $products->isEmpty()
                ? 'Je ne dispose pas de cette information actuellement. Je peux vous mettre en relation avec DK HOMETECH.'
                : 'Voici des produits de la même catégorie, présents dans le catalogue.';
        } elseif ($product && ! preg_match('/cherche|budget|moins de|fcfa/u', $folded)) {
            $reply = $this->aboutProduct($product, $folded);
            if (preg_match('/voici les|modèles disponibles/u', $reply)) {
                $products = $this->catalog->recommend($product)['similar'];
            }
        } else {
            $result = $this->catalog->search($message, 'chat');
            $products = $result['products'];
            $reply = $products->isEmpty()
                ? 'Je ne dispose pas de cette information actuellement. Je peux vous mettre en relation avec DK HOMETECH.'
                : 'Voici les modèles disponibles correspondant à votre demande.';
        }

        if (! $concrete) {
            $reply = $this->phrase($reply, $message, $products, $product, $history);
        }
        AiMessage::query()->create([
            'ai_conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => $reply,
        ]);

        return [
            'session_id' => $sessionId,
            'reply' => $reply,
            'products' => $products->values(),
            'provider' => $this->client->configured() ? 'provider' : 'catalogue',
        ];
    }

    /** @param array<string, mixed> $input */
    public function describe(array $input): array
    {
        $name = trim((string) ($input['name'] ?? ''));
        $brand = trim((string) ($input['brand'] ?? ''));
        $category = trim((string) ($input['category'] ?? ''));
        $specs = trim((string) ($input['specs'] ?? ''));
        $price = $input['price'] ?? null;
        $warranty = trim((string) ($input['warranty'] ?? ''));
        $draft = $this->draftCopy($name, $brand, $category, $specs, $price, $warranty);

        $system = 'Tu rédiges une fiche DK HOMETECH en français. Réponds uniquement en JSON avec les clés title, short_description, description, advantages, specs, seo_title, meta_description, keywords. N’ajoute aucune caractéristique, aucun prix, aucune garantie qui ne figure pas dans les données fournies. Si une information manque, laisse la chaîne vide.';
        $json = $this->client->complete('describe', $system, json_encode($draft, JSON_UNESCAPED_UNICODE) ?: '{}');
        if ($json) {
            $parsed = json_decode($this->unwrap($json), true);
            if (is_array($parsed)) {
                return $this->sanitizeCopy($parsed, $draft);
            }
        }

        return $draft;
    }

    /** @param array<string, mixed> $compare */
    public function phraseComparison(array $compare): string
    {
        $analysis = (string) ($compare['analysis'] ?? '');
        $names = collect($compare['products'] ?? [])->map(fn ($product) => $product->name)->implode(', ');
        $system = 'Tu compares des produits DK HOMETECH. Tu ne cites que les faits du texte fourni. Tu n’inventes aucune caractéristique. Tu ne déclares pas qu’un produit est le meilleur. Réponds en français, en 4 phrases maximum.';
        $text = $this->client->complete('compare', $system, "Produits : {$names}\nFaits : {$analysis}");
        if (! $text) {
            return $analysis;
        }
        foreach (['garantie inventée', 'consommation'] as $forbidden) {
            if (! str_contains(mb_strtolower($analysis), $forbidden) && str_contains(mb_strtolower($text), $forbidden)) {
                return $analysis;
            }
        }

        return $text;
    }

    /** @return array{mode: string, budget: int|null, sector: string|null}|null */
    private function equipmentRequest(string $message): ?array
    {
        $parsed = $this->catalog->interpret($message);
        $folded = mb_strtolower($message);
        $folded = strtr($folded, ['é' => 'e', 'è' => 'e', 'ê' => 'e', 'à' => 'a', 'ô' => 'o', 'ù' => 'u', 'ç' => 'c', 'î' => 'i', "'" => ' ', '’' => ' ']);
        if (! preg_match('/equip|amenag/u', $folded)) {
            return null;
        }
        $house = preg_match('/maison|salon|chambre|appartement/u', $folded);
        $office = preg_match('/bureau|entreprise|societe|hotel|restaurant|ecole|commerce|administration/u', $folded);
        $mode = 'maison';
        $sector = null;
        if ($office && ! $house) {
            $mode = preg_match('/bureau/u', $folded) && ! preg_match('/entreprise|hotel|restaurant|ecole|commerce|administration/u', $folded)
                ? 'bureau'
                : 'secteur';
            $sector = $mode === 'secteur' ? 'entreprise' : null;
        }

        return [
            'mode' => $mode,
            'budget' => $parsed['max_price'],
            'sector' => $sector,
        ];
    }

    /** @param array{items: list<array{product: Product, quantity: int, note: string|null}>, total: int, budget: int|null, message: string} $plan */
    private function formatPlan(array $plan): string
    {
        $items = $plan['items'];
        if ($items === []) {
            $budget = $plan['budget'] ? $this->money($plan['budget']) : null;

            return $budget
                ? "Aucun produit publié ne permet de composer cette sélection dans un budget de {$budget}."
                : 'Aucun produit publié ne permet de composer cette sélection.';
        }
        $lines = [];
        foreach ($items as $item) {
            $product = $item['product'];
            $qty = (int) $item['quantity'];
            $unit = (int) $product->effective_price;
            $line = $product->name.' × '.$qty.' — '.$this->money($unit * $qty);
            if ($item['note']) {
                $line .= ' ('.$item['note'].')';
            }
            $lines[] = $line;
        }
        $budget = $plan['budget'] ? $this->money((int) $plan['budget']) : null;
        $intro = $budget
            ? "Voici une sélection du catalogue pour équiper, dans un budget de {$budget}."
            : 'Voici une sélection de produits publiés pour équiper.';
        $left = $budget ? "\nReste : ".$this->money(max(0, (int) $plan['budget'] - (int) $plan['total'])).'.' : '';

        return $intro."\n".implode("\n", $lines)."\nTotal : ".$this->money((int) $plan['total']).'.'.$left."\nPrix enregistrés au catalogue. Ce n'est pas une facture.";
    }

    private function money(int $value): string
    {
        return number_format($value, 0, ',', ' ').' FCFA';
    }

    private function aboutProduct(Product $product, string $folded): string
    {
        $specs = is_array($product->specs) ? $product->specs : [];
        $hits = [];
        foreach ($specs as $key => $value) {
            $label = mb_strtolower((string) $key);
            if ($value === null || trim((string) $value) === '') {
                continue;
            }
            if ($this->sharesWord($folded, $label.' '.(string) $value) || preg_match('/caractér|caracter|détail|detail|fiche|info/u', $folded)) {
                $hits[] = $key.' : '.$value;
            }
        }
        if (preg_match('/prix|coute|coûte|budget/u', $folded) && $product->effective_price !== null) {
            $hits[] = 'Prix affiché : '.number_format($product->effective_price, 0, ',', ' ').' FCFA';
        }
        if (preg_match('/stock|disponible|disponibil/u', $folded)) {
            $hits[] = 'Stock enregistré : '.($product->stock_quantity === null ? 'quantité non suivie' : (string) $product->stock_quantity);
        }
        if ($hits === []) {
            return 'Je ne dispose pas de cette information actuellement. Je peux vous mettre en relation avec DK HOMETECH.';
        }

        return $product->name."\n".implode("\n", array_slice($hits, 0, 8));
    }

    private function phrase(string $reply, string $message, $products, ?Product $product, array $history): string
    {
        if (! $this->client->configured() || $products->isEmpty()) {
            return $reply;
        }
        $names = $products->pluck('name')->all();
        $system = 'Tu es l’assistant DK HOMETECH. Tu réponds en français, brièvement. Tu ne cites que les produits de la liste fournie. Tu n’inventes ni prix, ni stock, ni garantie. Si la liste est vide, dis que l’information n’est pas disponible.';
        $shop = $this->client->systemPrompt();
        if ($shop !== '') {
            $system .= "\nConsignes du magasin : ".$shop;
        }
        $payload = json_encode([
            'question' => $message,
            'produit_consulte' => $product?->name,
            'produits_autorises' => $names,
            'reponse_de_base' => $reply,
            'historique' => array_slice($history, -6),
        ], JSON_UNESCAPED_UNICODE);
        $text = $this->client->complete('chat', $system, (string) $payload);
        if (! $text) {
            return $reply;
        }
        foreach ($this->unknownNames($text, $names) as $unknown) {
            if ($unknown !== '') {
                return $reply;
            }
        }

        return $text;
    }

    /** @param list<string> $allowed
     *  @return list<string>
     */
    private function unknownNames(string $text, array $allowed): array
    {
        if ($allowed === []) {
            return [];
        }
        $folded = mb_strtolower($text);
        foreach ($allowed as $name) {
            if ($name !== '' && str_contains($folded, mb_strtolower($name))) {
                return [];
            }
        }

        return str_contains($folded, 'fcfa') ? ['prix non sourcé'] : [];
    }

    /** @return array<string, mixed> */
    private function draftCopy(string $name, string $brand, string $category, string $specs, mixed $price, string $warranty): array
    {
        $bits = array_filter([$brand, $category]);
        $intro = $name !== '' ? $name : 'Produit';
        if ($bits !== []) {
            $intro .= ' — '.implode(', ', $bits);
        }
        $priceLine = is_numeric($price) ? 'Prix affiché : '.number_format((int) $price, 0, ',', ' ').' FCFA.' : '';
        $warrantyLine = $warranty !== '' ? 'Garantie indiquée : '.$warranty.'.' : '';
        $description = trim(implode("\n", array_filter([
            $intro.'.',
            $specs !== '' ? "Caractéristiques fournies :\n".$specs : '',
            $priceLine,
            $warrantyLine,
        ])));

        return [
            'title' => $name,
            'short_description' => mb_substr(trim($intro.($priceLine ? ' '.$priceLine : '')), 0, 180),
            'description' => $description,
            'advantages' => '',
            'specs' => $specs,
            'seo_title' => $name !== '' ? $name.' | DK HOMETECH' : '',
            'meta_description' => mb_substr($description, 0, 155),
            'keywords' => implode(', ', array_filter([$category, $brand, 'DK HOMETECH', 'Dakar'])),
            'source' => 'catalogue',
        ];
    }

    /** @param array<string, mixed> $parsed
     *  @param array<string, mixed> $draft
     *  @return array<string, mixed>
     */
    private function sanitizeCopy(array $parsed, array $draft): array
    {
        $out = $draft;
        foreach (['title', 'short_description', 'description', 'advantages', 'specs', 'seo_title', 'meta_description', 'keywords'] as $key) {
            if (! isset($parsed[$key]) || ! is_string($parsed[$key])) {
                continue;
            }
            $out[$key] = trim($parsed[$key]);
        }
        $out['source'] = 'provider';
        if ($draft['specs'] === '') {
            $out['specs'] = '';
        }

        return $out;
    }

    private function unwrap(string $json): string
    {
        $json = trim($json);
        if (str_starts_with($json, '```')) {
            $json = preg_replace('/^```(?:json)?|```$/m', '', $json) ?: $json;
        }

        return trim($json);
    }

    private function isGreeting(string $text): bool
    {
        return (bool) preg_match('/^(bonjour|salut|hello|bonsoir)[ !.]*$/u', trim($text));
    }

    private function sharesWord(string $question, string $fact): bool
    {
        foreach (preg_split('/[^\p{L}\p{N}]+/u', $question) ?: [] as $word) {
            if (mb_strlen((string) $word) >= 4 && str_contains(mb_strtolower($fact), mb_strtolower((string) $word))) {
                return true;
            }
        }

        return false;
    }
}
