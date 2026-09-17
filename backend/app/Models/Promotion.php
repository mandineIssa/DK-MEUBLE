<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Promotion extends Model
{
    protected $fillable = [
        'product_id',
        'category_id',
        'price_original',
        'price_promo',
        'discount_percent',
        'discount_type',
        'start_date',
        'end_date',
        'status',
        'stock_quantity',
        'is_featured',
        'featured_order',
        'vendor_name',
        'created_by',
        'notes',
    ];

    protected $casts = [
        'price_original' => 'integer',
        'price_promo' => 'integer',
        'discount_percent' => 'float',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'stock_quantity' => 'integer',
        'is_featured' => 'boolean',
        'featured_order' => 'integer',
    ];

    protected $appends = ['discount_label', 'is_live'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function audits(): HasMany
    {
        return $this->hasMany(PromotionAudit::class)->latest();
    }

    public function getDiscountLabelAttribute(): string
    {
        $pct = round((float) $this->discount_percent);

        return '-'.$pct.' %';
    }

    public function getIsLiveAttribute(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }
        $now = now();

        return $this->start_date <= $now
            && $this->end_date >= $now
            && ($this->stock_quantity === null || $this->stock_quantity > 0);
    }

    public function scopePublicVisible($query)
    {
        $now = now();

        return $query
            ->where('status', 'active')
            ->where('start_date', '<=', $now)
            ->where('end_date', '>=', $now)
            ->where(function ($q) {
                $q->whereNull('stock_quantity')->orWhere('stock_quantity', '>', 0);
            });
    }

    public static function computeDiscountPercent(int $original, int $promo): float
    {
        if ($original <= 0) {
            return 0;
        }

        return round((1 - ($promo / $original)) * 100, 2);
    }
}
