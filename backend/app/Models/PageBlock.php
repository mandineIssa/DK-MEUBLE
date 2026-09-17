<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PageBlock extends Model
{
    protected $fillable = ['page_key', 'block_key', 'content', 'sort_order'];

    protected function casts(): array
    {
        return [
            'content' => 'array',
        ];
    }
}
