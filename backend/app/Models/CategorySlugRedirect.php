<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CategorySlugRedirect extends Model
{
    protected $fillable = [
        'old_slug',
        'new_slug',
    ];
}
