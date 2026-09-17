<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $productId = $this->route('product')?->id;

        return [
            'category_id' => ['required', 'exists:categories,id'],
            'brand_id' => ['nullable', 'exists:brands,id'],
            'name' => ['required', 'string', 'max:150'],
            'slug' => ['nullable', 'string', 'max:170', Rule::unique('products', 'slug')->ignore($productId)],
            'sku' => ['nullable', 'string', 'max:80'],
            'description' => ['nullable', 'string'],
            'short_description' => ['nullable', 'string', 'max:500'],
            'price' => ['nullable', 'integer', 'min:0'],
            'promo_price' => ['nullable', 'integer', 'min:0'],
            'condition' => ['nullable', Rule::in(['neuf', 'reconditionne'])],
            'is_clearance' => ['sometimes', 'boolean'],
            'stock_quantity' => ['nullable', 'integer', 'min:0'],
            'specs' => ['nullable', 'array'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'is_customizable' => ['sometimes', 'boolean'],
            'status' => ['required', Rule::in(['draft', 'published', 'archived'])],
            'attribute_values' => ['nullable', 'array'],
            'attribute_values.*.category_attribute_id' => ['required_with:attribute_values', 'exists:category_attributes,id'],
            'attribute_values.*.value' => ['required_with:attribute_values', 'string', 'max:255'],
            'showroom_stocks' => ['nullable', 'array'],
            'showroom_stocks.*.showroom_id' => ['required_with:showroom_stocks', 'exists:showrooms,id'],
            'showroom_stocks.*.stock_quantity' => ['nullable', 'integer', 'min:0'],
            'showroom_stocks.*.is_available' => ['nullable', 'boolean'],
        ];
    }
}
