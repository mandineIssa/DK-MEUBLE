<?php

namespace App\Models;

use App\Models\Concerns\HasMedia;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Brand extends Model
{
    use HasMedia;
    protected $fillable = [
        'name', 'slug', 'logo_path', 'description', 'is_featured', 'show_in_footer',
        'display_order', 'meta_title', 'meta_description', 'is_active',
    ];

    protected $casts = [
        'is_featured' => 'boolean',
        'show_in_footer' => 'boolean',
        'is_active' => 'boolean',
        'display_order' => 'integer',
    ];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true)->where('is_active', true);
    }
}
