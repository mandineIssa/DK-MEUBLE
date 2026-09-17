<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FooterLink extends Model
{
    protected $fillable = [
        'footer_column_id', 'label', 'url', 'display_order', 'is_active', 'opens_new_tab',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'opens_new_tab' => 'boolean',
        'display_order' => 'integer',
    ];

    public function column(): BelongsTo
    {
        return $this->belongsTo(FooterColumn::class, 'footer_column_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
