<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Wishlist extends Model
{
    protected $fillable = [
        'customer_id',
        'product_id',
        'price_at_save',
        'last_notified_at',
        'last_stock_notified_at',
    ];

    protected $casts = [
        'price_at_save' => 'integer',
        'last_notified_at' => 'datetime',
        'last_stock_notified_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
