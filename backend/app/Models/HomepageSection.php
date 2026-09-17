<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HomepageSection extends Model
{
    protected $fillable = [
        'type',
        'title',
        'subtitle',
        'category_id',
        'banner_image',
        'banner_link',
        'selection_mode',
        'products_limit',
        'display_order',
        'is_active',
        'meta',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'products_limit' => 'integer',
        'display_order' => 'integer',
        'meta' => 'array',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function slides(): HasMany
    {
        return $this->hasMany(HomepageSlide::class, 'section_id')->orderBy('display_order');
    }

    public function items(): HasMany
    {
        return $this->hasMany(HomepageSectionItem::class, 'section_id')->orderBy('display_order');
    }

    public function featuredProducts(): HasMany
    {
        return $this->hasMany(HomepageFeaturedProduct::class, 'section_id')->orderBy('display_order');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
