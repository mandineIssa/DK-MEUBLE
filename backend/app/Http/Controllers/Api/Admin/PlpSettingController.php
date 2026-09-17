<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\PlpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlpSettingController extends Controller
{
    public function show(PlpService $plp): JsonResponse
    {
        return response()->json($plp->settingsForAdmin());
    }

    public function update(Request $request, PlpService $plp): JsonResponse
    {
        $data = $request->validate([
            'filters' => ['sometimes', 'array'],
            'filters.category' => ['sometimes', 'boolean'],
            'filters.price' => ['sometimes', 'boolean'],
            'filters.brand' => ['sometimes', 'boolean'],
            'filters.condition' => ['sometimes', 'boolean'],
            'filters.attributes' => ['sometimes', 'boolean'],
            'filters.availability' => ['sometimes', 'boolean'],
            'sort_options' => ['sometimes', 'array'],
            'sort_options.*.value' => ['required_with:sort_options', 'string', 'max:40'],
            'sort_options.*.label' => ['required_with:sort_options', 'string', 'max:80'],
            'sort_options.*.enabled' => ['sometimes', 'boolean'],
            'default_sort' => ['sometimes', 'string', 'max:40'],
            'default_view' => ['sometimes', 'in:grid_2,grid_3,grid_4,list'],
            'view_modes' => ['sometimes', 'array'],
            'view_modes.grid_2' => ['sometimes', 'boolean'],
            'view_modes.grid_3' => ['sometimes', 'boolean'],
            'view_modes.grid_4' => ['sometimes', 'boolean'],
            'view_modes.list' => ['sometimes', 'boolean'],
            'accordion_mode' => ['sometimes', 'in:exclusive,multiple'],
            'show_subcategories' => ['sometimes', 'boolean'],
            'category_order' => ['sometimes', 'in:manual,alpha,custom'],
            'category_filter_title' => ['sometimes', 'string', 'max:120'],
            'category_filter_items' => ['sometimes', 'array'],
            'category_filter_items.*.id' => ['required_with:category_filter_items', 'integer'],
            'category_filter_items.*.enabled' => ['sometimes', 'boolean'],
            'category_filter_items.*.label' => ['nullable', 'string', 'max:120'],
            'category_filter_items.*.children' => ['sometimes', 'array'],
            'category_filter_items.*.children.*.id' => ['required', 'integer'],
            'category_filter_items.*.children.*.enabled' => ['sometimes', 'boolean'],
            'category_filter_items.*.children.*.label' => ['nullable', 'string', 'max:120'],
            'accent_color' => ['sometimes', 'string', 'max:20'],
            'popularity_logic' => ['sometimes', 'in:quotes,manual'],
            'per_page' => ['sometimes', 'integer', 'min:6', 'max:48'],
            'realtime_filter' => ['sometimes', 'boolean'],
            'infinite_scroll' => ['sometimes', 'boolean'],
            'show_breadcrumb' => ['sometimes', 'boolean'],
        ]);

        return response()->json($plp->updateSettings($data));
    }
}
