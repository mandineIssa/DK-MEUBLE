<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SearchQuery extends Model
{
    protected $fillable = ['query', 'source', 'results_count', 'parsed'];

    protected $casts = ['parsed' => 'array'];
}
