<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\Ai\AiClient;
use App\Services\Ai\CatalogAssistant;
use App\Services\Ai\CatalogSearch;
use App\Services\Ai\SelectionQuote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AiController extends Controller
{
    public function status(AiClient $ai): JsonResponse
    {
        return response()->json($ai->publicStatus());
    }

    public function search(Request $request, CatalogSearch $catalog): JsonResponse
    {
        $data = $request->validate([
            'query' => ['required', 'string', 'min:2', 'max:300'],
            'source' => ['nullable', 'in:text,voice,image'],
        ]);
        $result = $catalog->search($data['query'], $data['source'] ?? 'text');

        return response()->json([
            'parsed' => $result['parsed'],
            'products' => $result['products'],
            'groups' => $result['groups'],
            'message' => $result['message'],
        ]);
    }

    public function chat(Request $request, CatalogAssistant $assistant, AiClient $ai): JsonResponse
    {
        if (! $ai->assistantEnabled()) {
            return response()->json([
                'reply' => 'L’assistant est désactivé. Vous pouvez écrire à DK HOMETECH sur WhatsApp ou via la page contact.',
                'products' => [],
                'provider' => 'catalogue',
            ]);
        }
        $data = $request->validate([
            'message' => ['required', 'string', 'min:1', 'max:2000'],
            'session_id' => ['nullable', 'string', 'max:64'],
            'product_slug' => ['nullable', 'string', 'max:170'],
            'page_path' => ['nullable', 'string', 'max:255'],
            'history' => ['nullable', 'array', 'max:8'],
            'history.*.role' => ['required_with:history', 'in:user,assistant'],
            'history.*.content' => ['required_with:history', 'string', 'max:2000'],
        ]);
        $result = $assistant->chat(
            $data['message'],
            $data['session_id'] ?? null,
            $data['product_slug'] ?? null,
            $data['page_path'] ?? null,
            $data['history'] ?? [],
        );

        return response()->json($result);
    }

    public function compare(Request $request, CatalogSearch $catalog, CatalogAssistant $assistant): JsonResponse
    {
        $data = $request->validate([
            'slugs' => ['required', 'array', 'min:2', 'max:4'],
            'slugs.*' => ['string', 'max:170'],
        ]);
        $result = $catalog->compare($data['slugs']);
        $result['analysis'] = $assistant->phraseComparison($result);

        return response()->json($result);
    }

    public function plan(Request $request, CatalogSearch $catalog): JsonResponse
    {
        $data = $this->planData($request);

        return response()->json($catalog->plan($data));
    }

    public function planPdf(Request $request, CatalogSearch $catalog, SelectionQuote $quote): Response
    {
        if (! class_exists(\Dompdf\Dompdf::class)) {
            return response()->json(['message' => 'La génération PDF est indisponible sur ce serveur.'], 503);
        }
        $plan = $catalog->plan($this->planData($request));
        if ($plan['items'] === []) {
            return response()->json(['message' => $plan['message']], 422);
        }

        return response($quote->pdf($plan), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="estimation-dk-hometech.pdf"',
        ]);
    }

    public function recommendations(string $slug, CatalogSearch $catalog): JsonResponse
    {
        $product = Product::query()->published()->with(['category', 'images', 'brand', 'promotions'])->where('slug', $slug)->firstOrFail();
        $sets = $catalog->recommend($product);

        return response()->json([
            'similar' => $sets['similar'],
            'also' => $sets['also'],
            'budget' => $sets['budget'],
            'complement' => $sets['complement'],
        ]);
    }

    public function forYou(Request $request, CatalogSearch $catalog): JsonResponse
    {
        $data = $request->validate([
            'slugs' => ['nullable', 'array', 'max:12'],
            'slugs.*' => ['string', 'max:170'],
            'visitor_id' => ['nullable', 'string', 'max:80'],
        ]);
        $result = $catalog->forVisitor($data['slugs'] ?? [], $data['visitor_id'] ?? null);

        return response()->json([
            'products' => $result['products'],
            'message' => $result['message'],
        ]);
    }

    public function cartSuggestions(Request $request, CatalogSearch $catalog): JsonResponse
    {
        $data = $request->validate([
            'product_ids' => ['required', 'array', 'max:30'],
            'product_ids.*' => ['integer'],
        ]);

        return response()->json([
            'products' => $catalog->complementsForCart($data['product_ids']),
        ]);
    }

    /** @return array<string, mixed> */
    private function planData(Request $request): array
    {
        return $request->validate([
            'mode' => ['required', 'in:maison,bureau,secteur'],
            'budget' => ['nullable', 'integer', 'min:0'],
            'rooms' => ['nullable', 'integer', 'min:1', 'max:30'],
            'style' => ['nullable', 'string', 'max:80'],
            'wants' => ['nullable', 'array', 'max:12'],
            'wants.*' => ['string', 'max:80'],
            'employees' => ['nullable', 'integer', 'min:1', 'max:500'],
            'desks' => ['nullable', 'integer', 'min:1', 'max:500'],
            'sector' => ['nullable', 'string', 'max:80'],
            'housing' => ['nullable', 'string', 'max:40'],
        ]);
    }
}
