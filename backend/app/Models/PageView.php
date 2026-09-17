<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PageView extends Model
{
    protected $fillable = [
        'path',
        'title',
        'referrer',
        'source',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'session_id',
        'visitor_id',
        'device',
        'user_agent',
    ];
}
