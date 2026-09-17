<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'reference', 'customer_id', 'customer_name', 'phone', 'email', 'address',
        'delivery_method', 'showroom_id', 'delivery_zone_id', 'delivery_fee',
        'payment_method', 'payment_status', 'order_status', 'subtotal', 'total',
        'customer_note',
    ];

    protected $casts = [
        'delivery_fee' => 'integer',
        'subtotal' => 'integer',
        'total' => 'integer',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function showroom(): BelongsTo
    {
        return $this->belongsTo(Showroom::class);
    }

    public function deliveryZone(): BelongsTo
    {
        return $this->belongsTo(DeliveryZone::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(OrderStatusLog::class)->latest();
    }
}
