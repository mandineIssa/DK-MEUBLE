<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\FooterColumn;
use App\Models\FooterLink;
use App\Models\FooterSocialLink;
use App\Models\PaymentMethodLogo;
use App\Services\FooterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FooterAdminController extends Controller
{
    public function show(FooterService $footer): JsonResponse
    {
        return response()->json([
            'settings' => $footer->settings(),
            'assembled' => $footer->assemble(),
            'columns' => FooterColumn::query()->with('links')->orderBy('display_order')->get(),
            'socials' => FooterSocialLink::query()->orderBy('display_order')->get(),
            'payments' => PaymentMethodLogo::query()->orderBy('display_order')->get(),
        ]);
    }

    public function updateSettings(Request $request, FooterService $footer): JsonResponse
    {
        $data = $request->validate([
            'newsletter_title' => ['sometimes', 'string', 'max:255'],
            'newsletter_text' => ['sometimes', 'string', 'max:5000'],
            'newsletter_legal_intro' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'newsletter_legal_link_label' => ['sometimes', 'nullable', 'string', 'max:255'],
            'newsletter_legal_url' => ['sometimes', 'nullable', 'string', 'max:500'],
            'newsletter_privacy_label' => ['sometimes', 'string', 'max:2000'],
            'newsletter_privacy_url' => ['sometimes', 'string', 'max:500'],
            'newsletter_privacy_link_label' => ['sometimes', 'nullable', 'string', 'max:255'],
            'newsletter_disclaimer' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'newsletter_cta' => ['sometimes', 'string', 'max:80'],
            'show_newsletter' => ['sometimes', 'boolean'],
            'app_block_title' => ['sometimes', 'string', 'max:255'],
            'app_block_subtitle' => ['sometimes', 'string', 'max:255'],
            'app_store_url' => ['sometimes', 'nullable', 'string', 'max:500'],
            'google_play_url' => ['sometimes', 'nullable', 'string', 'max:500'],
            'company_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'company_address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'company_phones' => ['sometimes', 'nullable', 'string', 'max:255'],
            'copyright_text' => ['sometimes', 'string', 'max:255'],
            'contact_heading' => ['sometimes', 'nullable', 'string', 'max:120'],
            'socials_heading' => ['sometimes', 'nullable', 'string', 'max:120'],
            'payments_heading' => ['sometimes', 'nullable', 'string', 'max:120'],
            'brands_heading' => ['sometimes', 'nullable', 'string', 'max:120'],
            'payments_empty_text' => ['sometimes', 'nullable', 'string', 'max:255'],
            'brands_only_featured' => ['sometimes', 'boolean'],
            'show_brands' => ['sometimes', 'boolean'],
            'columns_count' => ['sometimes', 'integer', 'min:3', 'max:5'],
        ]);

        return response()->json($footer->updateSettings($data));
    }

    public function seed(FooterService $footer): JsonResponse
    {
        return response()->json($footer->seedDefaults());
    }

    public function storeColumn(Request $request, FooterService $footer): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'display_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
        $col = FooterColumn::query()->create([
            'title' => $data['title'],
            'display_order' => $data['display_order'] ?? ((int) FooterColumn::query()->max('display_order') + 10),
            'is_active' => $data['is_active'] ?? true,
        ]);
        $footer->forgetCache();

        return response()->json($col->load('links'), 201);
    }

    public function updateColumn(Request $request, FooterColumn $column, FooterService $footer): JsonResponse
    {
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:120'],
            'display_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
        $column->update($data);
        $footer->forgetCache();

        return response()->json($column->fresh()->load('links'));
    }

    public function destroyColumn(FooterColumn $column, FooterService $footer): JsonResponse
    {
        $column->delete();
        $footer->forgetCache();

        return response()->json(['message' => 'Colonne supprimée']);
    }

    public function reorderColumns(Request $request, FooterService $footer): JsonResponse
    {
        $data = $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['integer'],
        ]);
        foreach ($data['order'] as $i => $id) {
            FooterColumn::query()->where('id', $id)->update(['display_order' => ($i + 1) * 10]);
        }
        $footer->forgetCache();

        return response()->json(['message' => 'Ordre mis à jour']);
    }

    public function storeLink(Request $request, FooterService $footer): JsonResponse
    {
        $data = $request->validate([
            'footer_column_id' => ['required', 'exists:footer_columns,id'],
            'label' => ['required', 'string', 'max:160'],
            'url' => ['required', 'string', 'max:500'],
            'display_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'opens_new_tab' => ['sometimes', 'boolean'],
        ]);
        $link = FooterLink::query()->create([
            ...$data,
            'display_order' => $data['display_order'] ?? ((int) FooterLink::query()->where('footer_column_id', $data['footer_column_id'])->max('display_order') + 10),
            'is_active' => $data['is_active'] ?? true,
            'opens_new_tab' => $data['opens_new_tab'] ?? false,
        ]);
        $footer->forgetCache();

        return response()->json($link, 201);
    }

    public function updateLink(Request $request, FooterLink $link, FooterService $footer): JsonResponse
    {
        $data = $request->validate([
            'label' => ['sometimes', 'string', 'max:160'],
            'url' => ['sometimes', 'string', 'max:500'],
            'display_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'opens_new_tab' => ['sometimes', 'boolean'],
            'footer_column_id' => ['sometimes', 'exists:footer_columns,id'],
        ]);
        $link->update($data);
        $footer->forgetCache();

        return response()->json($link->fresh());
    }

    public function destroyLink(FooterLink $link, FooterService $footer): JsonResponse
    {
        $link->delete();
        $footer->forgetCache();

        return response()->json(['message' => 'Lien supprimé']);
    }

    public function reorderLinks(Request $request, FooterService $footer): JsonResponse
    {
        $data = $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['integer'],
        ]);
        foreach ($data['order'] as $i => $id) {
            FooterLink::query()->where('id', $id)->update(['display_order' => ($i + 1) * 10]);
        }
        $footer->forgetCache();

        return response()->json(['message' => 'Ordre liens mis à jour']);
    }

    public function upsertSocial(Request $request, FooterService $footer): JsonResponse
    {
        $data = $request->validate([
            'id' => ['sometimes', 'integer', 'exists:footer_social_links,id'],
            'platform' => ['required', 'string', 'in:facebook,instagram,tiktok,x,youtube,whatsapp'],
            'url' => ['required', 'string', 'max:500'],
            'is_active' => ['sometimes', 'boolean'],
            'display_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        if (! empty($data['id'])) {
            $row = FooterSocialLink::query()->findOrFail($data['id']);
            $row->update($data);
        } else {
            $row = FooterSocialLink::query()->updateOrCreate(
                ['platform' => $data['platform']],
                [
                    'url' => $data['url'],
                    'is_active' => $data['is_active'] ?? true,
                    'display_order' => $data['display_order'] ?? 10,
                ]
            );
        }
        $footer->forgetCache();

        return response()->json($row);
    }

    public function destroySocial(FooterSocialLink $social, FooterService $footer): JsonResponse
    {
        $social->delete();
        $footer->forgetCache();

        return response()->json(['message' => 'Réseau supprimé']);
    }

    public function storePayment(Request $request, FooterService $footer): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'logo' => ['required', 'image', 'max:2048'],
            'display_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $path = $request->file('logo')->store('payments', 'public');
        $row = PaymentMethodLogo::query()->create([
            'name' => $data['name'],
            'logo_path' => $path,
            'display_order' => $data['display_order'] ?? ((int) PaymentMethodLogo::query()->max('display_order') + 10),
            'is_active' => $data['is_active'] ?? true,
        ]);
        $footer->forgetCache();

        return response()->json($row, 201);
    }

    public function updatePayment(Request $request, PaymentMethodLogo $payment, FooterService $footer): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:80'],
            'logo' => ['sometimes', 'image', 'max:2048'],
            'display_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if ($request->hasFile('logo')) {
            $data['logo_path'] = $request->file('logo')->store('payments', 'public');
        }
        unset($data['logo']);
        $payment->update($data);
        $footer->forgetCache();

        return response()->json($payment->fresh());
    }

    public function destroyPayment(PaymentMethodLogo $payment, FooterService $footer): JsonResponse
    {
        if ($payment->logo_path && ! str_starts_with($payment->logo_path, 'http')) {
            Storage::disk('public')->delete($payment->logo_path);
        }
        $payment->delete();
        $footer->forgetCache();

        return response()->json(['message' => 'Logo paiement supprimé']);
    }
}
