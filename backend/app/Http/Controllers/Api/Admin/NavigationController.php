<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Models\MenuSection;
use App\Services\NavigationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NavigationController extends Controller
{
    public function index(NavigationService $navigation): JsonResponse
    {
        $navigation->ensureDefaults();

        $sections = MenuSection::query()
            ->ordered()
            ->with([
                'category:id,name,slug,is_active',
                'items' => fn ($q) => $q->whereNull('parent_id')->orderBy('display_order')
                    ->with([
                        'category:id,name,slug,is_active',
                        'children' => fn ($c) => $c->orderBy('display_order')->with('category:id,name,slug,is_active'),
                    ]),
            ])
            ->get();

        return response()->json([
            'sections' => $sections,
            'settings' => $navigation->settings(),
            'broken_links' => $navigation->brokenLinks(),
            'preview' => $navigation->assemble(),
        ]);
    }

    public function storeSection(Request $request, NavigationService $navigation): JsonResponse
    {
        $data = $request->validate([
            'label' => ['required', 'string', 'max:190'],
            'linked_category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'custom_url' => ['nullable', 'string', 'max:2048'],
            'icon' => ['nullable', 'string', 'max:80'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $data['display_order'] = $data['display_order'] ?? (((int) MenuSection::query()->max('display_order')) + 10);
        $data['is_active'] = $data['is_active'] ?? true;

        $section = MenuSection::create($data);
        $navigation->forgetCache();

        return response()->json($section->load('category'), 201);
    }

    public function updateSection(Request $request, MenuSection $section, NavigationService $navigation): JsonResponse
    {
        $data = $request->validate([
            'label' => ['sometimes', 'string', 'max:190'],
            'linked_category_id' => ['sometimes', 'nullable', 'integer', 'exists:categories,id'],
            'custom_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'icon' => ['sometimes', 'nullable', 'string', 'max:80'],
            'display_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $section->update($data);
        $navigation->forgetCache();

        return response()->json($section->fresh()->load('category', 'items.category'));
    }

    public function destroySection(MenuSection $section, NavigationService $navigation): JsonResponse
    {
        $section->delete();
        $navigation->forgetCache();

        return response()->json(null, 204);
    }

    public function reorderSections(Request $request, NavigationService $navigation): JsonResponse
    {
        $data = $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['integer', 'exists:menu_sections,id'],
        ]);

        DB::transaction(function () use ($data) {
            foreach (array_values($data['order']) as $i => $id) {
                MenuSection::query()->where('id', $id)->update(['display_order' => ($i + 1) * 10]);
            }
        });

        $navigation->forgetCache();

        return response()->json(['ok' => true]);
    }

    public function storeItem(Request $request, NavigationService $navigation): JsonResponse
    {
        $data = $request->validate([
            'menu_section_id' => ['required', 'integer', 'exists:menu_sections,id'],
            'parent_id' => ['nullable', 'integer', 'exists:menu_items,id'],
            'label' => ['required', 'string', 'max:190'],
            'linked_category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'custom_url' => ['nullable', 'string', 'max:2048'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $data['display_order'] = $data['display_order'] ?? (((int) MenuItem::query()
            ->where('menu_section_id', $data['menu_section_id'])
            ->where('parent_id', $data['parent_id'] ?? null)
            ->max('display_order')) + 10);
        $data['is_active'] = $data['is_active'] ?? true;

        $item = MenuItem::create($data);
        $navigation->forgetCache();

        return response()->json($item->load('category'), 201);
    }

    public function updateItem(Request $request, MenuItem $item, NavigationService $navigation): JsonResponse
    {
        $data = $request->validate([
            'label' => ['sometimes', 'string', 'max:190'],
            'linked_category_id' => ['sometimes', 'nullable', 'integer', 'exists:categories,id'],
            'custom_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'parent_id' => ['sometimes', 'nullable', 'integer', 'exists:menu_items,id'],
            'display_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $item->update($data);
        $navigation->forgetCache();

        return response()->json($item->fresh()->load('category'));
    }

    public function destroyItem(MenuItem $item, NavigationService $navigation): JsonResponse
    {
        $item->delete();
        $navigation->forgetCache();

        return response()->json(null, 204);
    }

    public function reorderItems(Request $request, NavigationService $navigation): JsonResponse
    {
        $data = $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['integer', 'exists:menu_items,id'],
        ]);

        DB::transaction(function () use ($data) {
            foreach (array_values($data['order']) as $i => $id) {
                MenuItem::query()->where('id', $id)->update(['display_order' => ($i + 1) * 10]);
            }
        });

        $navigation->forgetCache();

        return response()->json(['ok' => true]);
    }

    public function brokenLinks(NavigationService $navigation): JsonResponse
    {
        return response()->json(['broken_links' => $navigation->brokenLinks()]);
    }

    public function settings(NavigationService $navigation): JsonResponse
    {
        return response()->json($navigation->settings());
    }

    public function updateSettings(Request $request, NavigationService $navigation): JsonResponse
    {
        $data = $request->validate([
            'columns' => ['sometimes', 'integer', 'min:2', 'max:6'],
            'mobile_mode' => ['sometimes', 'in:accordion,list'],
            'show_icons' => ['sometimes', 'boolean'],
            'show_product_counts' => ['sometimes', 'boolean'],
        ]);

        return response()->json($navigation->updateSettings($data));
    }
}
