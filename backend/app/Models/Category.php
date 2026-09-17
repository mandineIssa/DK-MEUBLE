<?php

namespace App\Models;

use App\Models\Concerns\HasMedia;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use HasFactory;
    use HasMedia;

    protected $fillable = [
        'parent_id',
        'name',
        'slug',
        'icon',
        'image_path',
        'description',
        'display_order',
        'is_active',
        'is_popular',
        'popular_order',
        'meta_title',
        'meta_description',
    ];

    protected $casts = [
        'display_order' => 'integer',
        'is_active' => 'boolean',
        'is_popular' => 'boolean',
        'popular_order' => 'integer',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('display_order')->orderBy('name');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function attributes(): HasMany
    {
        return $this->hasMany(CategoryAttribute::class)->orderBy('display_order');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeRoots($query)
    {
        return $query->whereNull('parent_id');
    }

    public function breadcrumb(): array
    {
        $trail = [];
        $cursor = $this;
        while ($cursor) {
            array_unshift($trail, [
                'id' => $cursor->id,
                'name' => $cursor->name,
                'slug' => $cursor->slug,
            ]);
            $cursor = $cursor->parent_id ? Category::query()->find($cursor->parent_id) : null;
        }

        return $trail;
    }
}
