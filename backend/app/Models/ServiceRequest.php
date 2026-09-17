<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceRequest extends Model
{
    protected $fillable = [
        'service_id',
        'customer_name',
        'phone',
        'email',
        'product_reference',
        'message',
        'status',
        'assigned_to',
    ];

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
