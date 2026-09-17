<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class B2bQuote extends Model
{
    protected $fillable = [
        'reference',
        'company_id',
        'customer_id',
        'title',
        'notes',
        'status',
        'total_amount',
        'valid_until',
    ];

    protected $casts = [
        'total_amount' => 'integer',
        'valid_until' => 'datetime',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(B2bQuoteItem::class);
    }

    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class);
    }

    public function recalculateTotal(): void
    {
        $total = $this->items()->get()->sum(fn (B2bQuoteItem $i) => $i->quantity * $i->unit_price);
        $this->update(['total_amount' => $total]);
    }
}
