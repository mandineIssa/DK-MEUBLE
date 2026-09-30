<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AiConversation extends Model
{
    protected $fillable = ['session_id', 'customer_id', 'page_path', 'product_id'];

    public function messages(): HasMany
    {
        return $this->hasMany(AiMessage::class);
    }
}
