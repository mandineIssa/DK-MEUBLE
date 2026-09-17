<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentMethodLogo extends Model
{
    protected $fillable = ['name', 'logo_path', 'display_order', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
        'display_order' => 'integer',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
