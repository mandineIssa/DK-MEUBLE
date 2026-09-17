<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FooterSocialLink extends Model
{
    protected $fillable = ['platform', 'url', 'is_active', 'display_order'];

    protected $casts = [
        'is_active' => 'boolean',
        'display_order' => 'integer',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
