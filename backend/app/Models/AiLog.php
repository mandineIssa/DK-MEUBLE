<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiLog extends Model
{
    protected $fillable = ['kind', 'status', 'latency_ms', 'message'];
}
