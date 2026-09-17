<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    protected $fillable = [
        'name',
        'ninea',
        'phone',
        'email',
        'address',
        'city',
        'notes',
        'status',
    ];

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    public function b2bQuotes(): HasMany
    {
        return $this->hasMany(B2bQuote::class)->latest();
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class)->latest();
    }
}
