<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CafeSession extends Model
{
    use HasFactory;

    protected $table = 'sessions';

    protected $fillable = [
        'device_id',
        'user_id',
        'started_at',
        'ends_at',
        'rate_type',
        'rate_php',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function pc()
    {
        return $this->belongsTo(Pc::class, 'device_id', 'device_id');
    }
}
