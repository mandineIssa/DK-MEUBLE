<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Customer extends Authenticatable
{
    use HasApiTokens;

    protected $fillable = [
        'company_id',
        'phone',
        'name',
        'email',
        'google_id',
        'facebook_id',
        'phone_verified_at',
        'is_b2b',
        'sms_opt_in',
        'email_opt_in',
    ];

    protected $casts = [
        'phone_verified_at' => 'datetime',
        'is_b2b' => 'boolean',
        'sms_opt_in' => 'boolean',
        'email_opt_in' => 'boolean',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class)->latest();
    }

    public function b2bQuotes(): HasMany
    {
        return $this->hasMany(B2bQuote::class)->latest();
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class)->latest();
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(ProductReview::class)->latest();
    }

    public function wishlists(): HasMany
    {
        return $this->hasMany(Wishlist::class)->latest();
    }
}
