<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PcCommand extends Model
{
    use HasFactory;

    protected $fillable = [
        'device_id',
        'requested_by',
        'command',
        'result',
        'message',
        'executed_at',
    ];

    protected $casts = [
        'executed_at' => 'datetime',
    ];
}
