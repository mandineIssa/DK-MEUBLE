<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeliveryZone extends Model
{
    protected $fillable = [
        'zone_name', 'city', 'delivery_fee', 'estimated_delay', 'is_active', 'display_order',
    ];

    protected $casts = [
        'delivery_fee' => 'integer',
        'is_active' => 'boolean',
        'display_order' => 'integer',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
