<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Company::query()->withCount(['customers', 'b2bQuotes', 'invoices'])->latest()->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $customerId = $data['customer_id'] ?? null;
        unset($data['customer_id']);

        $company = Company::query()->create($data);

        if ($customerId) {
            Customer::query()->whereKey($customerId)->update([
                'company_id' => $company->id,
                'is_b2b' => true,
            ]);
        }

        return response()->json($company->loadCount(['customers', 'b2bQuotes', 'invoices']), 201);
    }

    public function show(Company $company): JsonResponse
    {
        $company->load(['customers', 'b2bQuotes.items', 'invoices']);

        return response()->json($company);
    }

    public function update(Request $request, Company $company): JsonResponse
    {
        $data = $this->validated($request);
        unset($data['customer_id']);
        $company->update($data);

        return response()->json($company->fresh()->loadCount(['customers', 'b2bQuotes', 'invoices']));
    }

    public function destroy(Company $company): JsonResponse
    {
        $company->delete();

        return response()->json(null, 204);
    }

    public function attachCustomer(Request $request, Company $company): JsonResponse
    {
        $data = $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
        ]);

        Customer::query()->whereKey($data['customer_id'])->update([
            'company_id' => $company->id,
            'is_b2b' => true,
        ]);

        return response()->json($company->fresh()->load('customers'));
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'ninea' => ['nullable', 'string', 'max:60'],
            'phone' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:150'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', 'in:active,inactive'],
            'customer_id' => ['nullable', 'exists:customers,id'],
        ]);
    }
}
