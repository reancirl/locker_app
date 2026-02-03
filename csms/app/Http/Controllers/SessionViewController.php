<?php

namespace App\Http\Controllers;

use App\Models\CafeSession;
use App\Models\Pc;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;

class SessionViewController extends Controller
{
    public function index(): Response
    {
        $now = Carbon::now('Asia/Manila');

        $sessions = CafeSession::with(['user:id,username,name', 'pc:id,device_id,name'])
            ->where('ends_at', '>', $now)
            ->orderByDesc('started_at')
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
            'now' => $now->toIso8601String(),
        ]);
    }

    public function end(Request $request, CafeSession $session): RedirectResponse
    {
        $now = Carbon::now('Asia/Manila');
        $session->ends_at = $now;
        $session->save();

        $pc = Pc::firstOrCreate(['device_id' => $session->device_id]);
        $pc->unlocked_until = null; // clear cached unlock
        $pc->last_seen_at = $now;
        $pc->save();

        return back()->with('success', 'Session ended.');
    }
}
