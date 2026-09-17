<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppNotification extends Model
{
    protected $table = 'notifications';

    protected $fillable = [
        'customer_id',
        'admin_user_id',
        'type',
        'title',
        'message',
        'link',
        'data',
        'is_read',
        'channel_sent',
        'digest_key',
    ];

    protected $casts = [
        'data' => 'array',
        'channel_sent' => 'array',
        'is_read' => 'boolean',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function adminUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_user_id');
    }
}
