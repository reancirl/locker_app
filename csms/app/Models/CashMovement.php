<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CashMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'amount',
        'note',
        'user_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];
}
