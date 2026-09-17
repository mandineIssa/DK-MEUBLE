<?php

namespace App\Models;

use App\Models\Concerns\HasMedia;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Realization extends Model
{
    use HasFactory;
    use HasMedia;

    protected $fillable = [
        'title',
        'description',
        'image_url',
        'tag',
        'sort_order',
        'status',
    ];
}
