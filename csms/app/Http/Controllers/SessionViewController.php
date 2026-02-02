<?php

namespace App\Http\Controllers;

use App\Models\CafeSession;
use Inertia\Inertia;
use Inertia\Response;

class SessionViewController extends Controller
{
    public function index(): Response
    {
        $sessions = CafeSession::with(['user:id,username,name', 'pc:id,device_id,name'])
            ->orderByDesc('started_at')
            ->take(100)
            ->get([
                'id',
                'device_id',
                'user_id',
                'started_at',
                'ends_at',
                'rate_type',
                'rate_php',
                'created_at',
            ]);

        return Inertia::render('sessions/index', [
            'sessions' => $sessions,
        ]);
    }
}
