<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class B2bQuoteItem extends Model
{
    protected $fillable = [
        'b2b_quote_id',
        'product_id',
        'label',
        'quantity',
        'unit_price',
        'dimensions',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'integer',
    ];

    public function quote(): BelongsTo
    {
        return $this->belongsTo(B2bQuote::class, 'b2b_quote_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function getLineTotalAttribute(): int
    {
        return $this->quantity * $this->unit_price;
    }
}
