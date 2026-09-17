<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function me(Request $request): JsonResponse
    {
        /** @var \App\Models\Customer $customer */
        $customer = $request->user();

        $customer->load([
            'company',
            'quotes' => fn ($q) => $q->with('product:id,name,slug')->limit(50),
            'b2bQuotes' => fn ($q) => $q->with(['items', 'company'])->limit(50),
            'invoices' => fn ($q) => $q->with('company')->limit(50),
        ]);

        // Also load company quotes/invoices if attached to company
        $companyQuotes = [];
        $companyInvoices = [];
        if ($customer->company_id) {
            $companyQuotes = $customer->company
                ?->b2bQuotes()
                ->with('items')
                ->limit(50)
                ->get() ?? [];
            $companyInvoices = $customer->company
                ?->invoices()
                ->limit(50)
                ->get() ?? [];
        }

        return response()->json([
            'id' => $customer->id,
            'phone' => $customer->phone,
            'name' => $customer->name,
            'email' => $customer->email,
            'phone_verified_at' => $customer->phone_verified_at,
            'is_b2b' => (bool) $customer->is_b2b,
            'sms_opt_in' => (bool) $customer->sms_opt_in,
            'email_opt_in' => (bool) $customer->email_opt_in,
            'company' => $customer->company,
            'quotes' => $customer->quotes,
            'b2b_quotes' => $companyQuotes ?: $customer->b2bQuotes,
            'invoices' => $companyInvoices ?: $customer->invoices,
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        /** @var \App\Models\Customer $customer */
        $customer = $request->user();

        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:120'],
            'email' => ['nullable', 'email', 'max:150'],
            'sms_opt_in' => ['nullable', 'boolean'],
            'email_opt_in' => ['nullable', 'boolean'],
        ]);

        $customer->fill($data)->save();

        return response()->json($customer->only([
            'id', 'phone', 'name', 'email', 'is_b2b', 'sms_opt_in', 'email_opt_in',
        ]));
    }

    public function registerCompany(Request $request): JsonResponse
    {
        /** @var \App\Models\Customer $customer */
        $customer = $request->user();

        if ($customer->company_id) {
            return response()->json(['message' => 'Vous êtes déjà rattaché à une entreprise.'], 422);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'ninea' => ['nullable', 'string', 'max:60'],
            'phone' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:150'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
        ]);

        $company = Company::query()->create([
            ...$data,
            'phone' => $data['phone'] ?? $customer->phone,
            'email' => $data['email'] ?? $customer->email,
            'status' => 'active',
        ]);

        $customer->update([
            'company_id' => $company->id,
            'is_b2b' => true,
        ]);

        return response()->json([
            'message' => 'Espace entreprise créé.',
            'company' => $company,
        ], 201);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Déconnecté.']);
    }
}
