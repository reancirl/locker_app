<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pc extends Model
{
    use HasFactory;

    protected $fillable = [
        'device_id',
        'name',
        'default_minutes',
        'unlocked_until',
        'last_seen_at',
    ];

    protected $casts = [
        'unlocked_until' => 'datetime',
        'last_seen_at' => 'datetime',
        'default_minutes' => 'integer',
    ];
}
