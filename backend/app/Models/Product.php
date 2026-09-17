<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'brand_id',
        'name',
        'slug',
        'sku',
        'description',
        'short_description',
        'price',
        'promo_price',
        'condition',
        'is_clearance',
        'stock_quantity',
        'specs',
        'meta_title',
        'meta_description',
        'is_customizable',
        'status',
    ];

    protected $casts = [
        'price' => 'integer',
        'promo_price' => 'integer',
        'is_customizable' => 'boolean',
        'is_clearance' => 'boolean',
        'stock_quantity' => 'integer',
        'specs' => 'array',
    ];

    protected $appends = [
        'effective_price',
        'compare_at_price',
        'discount_percent',
        'badge_label',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('order');
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(ProductReview::class);
    }

    public function promotions(): HasMany
    {
        return $this->hasMany(Promotion::class);
    }

    public function attributeValues(): HasMany
    {
        return $this->hasMany(ProductAttributeValue::class);
    }

    public function showrooms(): BelongsToMany
    {
        return $this->belongsToMany(Showroom::class, 'product_showroom')
            ->withPivot(['stock_quantity', 'is_available'])
            ->withTimestamps();
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function activePromotion(): ?Promotion
    {
        if ($this->relationLoaded('promotions')) {
            return $this->promotions->first(fn (Promotion $p) => $p->is_live);
        }

        return $this->promotions()->publicVisible()->first();
    }

    public function getEffectivePriceAttribute(): ?int
    {
        $promo = $this->activePromotion();
        if ($promo) {
            return (int) $promo->price_promo;
        }
        if ($this->promo_price !== null && $this->price !== null && $this->promo_price < $this->price) {
            return (int) $this->promo_price;
        }

        return $this->price !== null ? (int) $this->price : null;
    }

    public function getCompareAtPriceAttribute(): ?int
    {
        $promo = $this->activePromotion();
        if ($promo) {
            return (int) $promo->price_original;
        }
        if ($this->promo_price !== null && $this->price !== null && $this->promo_price < $this->price) {
            return (int) $this->price;
        }

        return null;
    }

    public function getDiscountPercentAttribute(): ?float
    {
        $compare = $this->compare_at_price;
        $effective = $this->effective_price;
        if (! $compare || ! $effective || $compare <= 0 || $effective >= $compare) {
            return null;
        }

        return round((1 - ($effective / $compare)) * 100, 2);
    }

    public function getBadgeLabelAttribute(): ?string
    {
        if ($this->is_clearance) {
            return 'Destockage';
        }
        if ($this->condition === 'reconditionne') {
            return 'Reconditionné';
        }
        $pct = $this->discount_percent;
        if ($pct !== null && $pct > 0) {
            return '-'.round($pct).' %';
        }

        return null;
    }
}
