<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\CategoryAttribute;
use App\Services\CategoryService;
use App\Services\NavigationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index(CategoryService $service): JsonResponse
    {
        return response()->json([
            'tree' => $service->tree(false),
            'flat' => Category::query()->orderBy('display_order')->orderBy('name')->get(),
            'settings' => $service->settings(),
        ]);
    }

    public function store(Request $request, CategoryService $service): JsonResponse
    {
        $data = $this->validated($request);
        $service->assertParentAllowed($data['parent_id'] ?? null);
        $data['slug'] = $service->uniqueSlug($data['name'], $data['slug'] ?? null);
        $data['display_order'] = $data['display_order'] ?? ((int) Category::query()
            ->where('parent_id', $data['parent_id'] ?? null)
            ->max('display_order') + 1);

        $category = Category::query()->create($data);
        $service->forgetTreeCache();

        return response()->json($category->load('children'), 201);
    }

    public function update(Request $request, Category $category, CategoryService $service, NavigationService $navigation): JsonResponse
    {
        $data = $this->validated($request, $category);
        if (array_key_exists('parent_id', $data)) {
            $service->assertParentAllowed($data['parent_id'], $category->id);
        }

        $oldSlug = $category->slug;
        if (! empty($data['slug']) || ! empty($data['name'])) {
            $data['slug'] = $service->uniqueSlug(
                $data['name'] ?? $category->name,
                $data['slug'] ?? $category->slug,
                $category->id
            );
        }

        $category->update($data);

        if (isset($data['slug']) && $data['slug'] !== $oldSlug) {
            $service->recordSlugRedirect($oldSlug, $data['slug']);
        }

        $navigation->forgetCache();
        $service->forgetTreeCache();

        return response()->json($category->fresh()->load('children', 'attributes.options'));
    }

    public function destroy(Request $request, Category $category, CategoryService $service, NavigationService $navigation): JsonResponse
    {
        $moveTo = $request->input('move_to_id', $request->query('move_to_id'));
        $service->reassignAndDelete($category, $moveTo !== null && $moveTo !== '' ? (int) $moveTo : null);
        $navigation->forgetCache();
        $service->forgetTreeCache();

        return response()->json(['message' => 'Catégorie supprimée.']);
    }

    public function reorder(Request $request, CategoryService $service): JsonResponse
    {
        $data = $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'integer', 'exists:categories,id'],
            'items.*.parent_id' => ['nullable', 'integer', 'exists:categories,id'],
            'items.*.display_order' => ['required', 'integer', 'min:0'],
        ]);

        foreach ($data['items'] as $item) {
            Category::query()->whereKey($item['id'])->update([
                'parent_id' => $item['parent_id'] ?? null,
                'display_order' => $item['display_order'],
            ]);
        }

        $service->forgetTreeCache();

        return response()->json(['message' => 'Ordre mis à jour.']);
    }

    public function settings(CategoryService $service): JsonResponse
    {
        return response()->json($service->settings());
    }

    public function updateSettings(Request $request, CategoryService $service): JsonResponse
    {
        $data = $request->validate([
            'max_depth' => ['sometimes', 'integer', 'in:2,3'],
            'hide_empty' => ['sometimes', 'boolean'],
            'show_breadcrumb' => ['sometimes', 'boolean'],
            'default_sort' => ['sometimes', 'in:newest,price_asc,price_desc,promo'],
        ]);

        $settings = $service->updateSettings($data);
        $service->forgetTreeCache();

        return response()->json($settings);
    }
    public function uploadImage(Request $request, Category $category): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp,svg', 'max:4096'],
        ]);

        if ($category->image_path) {
            Storage::disk('public')->delete($category->image_path);
        }

        $path = $request->file('image')->store('categories', 'public');
        $category->update(['image_path' => $path]);

        return response()->json($category);
    }

    public function storeAttribute(Request $request, Category $category): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['nullable', 'string', 'max:120'],
            'field_type' => ['required', 'in:select,number,boolean'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'is_filterable' => ['nullable', 'boolean'],
            'options' => ['nullable', 'array'],
            'options.*' => ['string', 'max:120'],
        ]);

        $attr = $category->attributes()->create([
            'name' => $data['name'],
            'slug' => Str::slug($data['slug'] ?? $data['name']),
            'field_type' => $data['field_type'],
            'display_order' => $data['display_order'] ?? 0,
            'is_filterable' => $data['is_filterable'] ?? true,
        ]);

        foreach ($data['options'] ?? [] as $i => $value) {
            $attr->options()->create([
                'value' => $value,
                'display_order' => $i,
            ]);
        }

        return response()->json($attr->load('options'), 201);
    }

    public function destroyAttribute(Category $category, CategoryAttribute $attribute): JsonResponse
    {
        if ($attribute->category_id !== $category->id) {
            abort(404);
        }
        $attribute->delete();

        return response()->json(null, 204);
    }

    public function seedSuggested(CategoryService $service, NavigationService $navigation): JsonResponse
    {
        $result = $service->seedMasterOfficeCatalog();
        $nav = $navigation->rebuildFromCategories();

        return response()->json([
            'message' => 'Arborescence importée (Électroménager en 3 blocs Jumia + Meubles, Bureaux, TV) et méga-menu synchronisé.',
            'created' => $result['created'],
            'updated' => $result['updated'],
            'navigation_sections' => $nav['sections'],
            'tree' => $service->tree(false),
        ]);
    }

    private function validated(Request $request, ?Category $existing = null): array
    {
        return $request->validate([
            'name' => [$existing ? 'sometimes' : 'required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('categories', 'slug')->ignore($existing?->id),
            ],
            'parent_id' => ['nullable', 'integer', 'exists:categories,id'],
            'icon' => ['nullable', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:5000'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'is_popular' => ['nullable', 'boolean'],
            'popular_order' => ['nullable', 'integer', 'min:0'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
        ]);
    }
}
