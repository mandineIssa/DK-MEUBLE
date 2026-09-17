<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // formulaire public
    }

    public function rules(): array
    {
        return [
            'product_id' => ['nullable', 'exists:products,id'],
            'name' => ['required', 'string', 'max:150'],
            'phone' => ['required', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:150'],
            'company_name' => ['nullable', 'string', 'max:150'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'dimensions' => ['nullable', 'string', 'max:150'],
            'message' => ['required', 'string', 'max:2000'],
        ];
    }
}
