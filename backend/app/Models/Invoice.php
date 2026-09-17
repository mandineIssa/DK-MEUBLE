<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    protected $fillable = [
        'reference',
        'company_id',
        'b2b_quote_id',
        'customer_id',
        'title',
        'amount',
        'status',
        'issued_at',
        'due_at',
        'notes',
    ];

    protected $casts = [
        'amount' => 'integer',
        'issued_at' => 'date',
        'due_at' => 'date',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function quote(): BelongsTo
    {
        return $this->belongsTo(B2bQuote::class, 'b2b_quote_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
