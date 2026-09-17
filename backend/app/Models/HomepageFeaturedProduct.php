<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HomepageFeaturedProduct extends Model
{
    protected $fillable = [
        'section_id',
        'product_id',
        'display_order',
    ];

    protected $casts = [
        'display_order' => 'integer',
    ];

    public function section(): BelongsTo
    {
        return $this->belongsTo(HomepageSection::class, 'section_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
