<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('search', ''));

        $customers = Customer::query()
            ->withCount(['quotes', 'wishlists'])
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($inner) use ($q) {
                    $inner->where('phone', 'like', "%{$q}%")
                        ->orWhere('email', 'like', "%{$q}%")
                        ->orWhere('name', 'like', "%{$q}%");
                });
            })
            ->latest()
            ->get();

        return response()->json($customers);
    }

    public function show(Customer $customer): JsonResponse
    {
        $customer->load([
            'quotes.product:id,name,slug',
            'wishlists.product:id,name,slug,price',
        ]);

        return response()->json($customer->loadCount('wishlists'));
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:150'],
            'email' => ['nullable', 'email', 'max:150'],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        $customer->update($data);

        return response()->json($customer->fresh()->loadCount('quotes'));
    }

    public function destroy(Customer $customer): JsonResponse
    {
        $customer->tokens()->delete();
        $customer->delete();

        return response()->json(['message' => 'Compte client supprimé.']);
    }
}
