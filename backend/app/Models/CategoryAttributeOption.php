<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CategoryAttributeOption extends Model
{
    protected $fillable = [
        'category_attribute_id',
        'value',
        'display_order',
    ];

    protected $casts = [
        'display_order' => 'integer',
    ];

    public function attribute(): BelongsTo
    {
        return $this->belongsTo(CategoryAttribute::class, 'category_attribute_id');
    }
}
