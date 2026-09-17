<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Campaign extends Model
{
    protected $fillable = [
        'title',
        'channel',
        'subject',
        'body',
        'audience',
        'status',
        'sent_sms',
        'sent_email',
        'failed',
        'sent_at',
    ];

    protected $casts = [
        'sent_sms' => 'integer',
        'sent_email' => 'integer',
        'failed' => 'integer',
        'sent_at' => 'datetime',
    ];
}
