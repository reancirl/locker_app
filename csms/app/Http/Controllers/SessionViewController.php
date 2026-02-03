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
    public function index()
    {
        $now = now(); // keep it as Carbon, in app timezone

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
            ])
            ->map(function ($session) use ($now) {
                $start = $session->started_at ?? $session->created_at ?? $now;

                // Force consistent timezone (optional but recommended)
                $start = $start->copy()->utc();
                $nowUtc = $now->copy()->utc();

                // Minutes used = now - start (signed), clamp to 0
                $minutes = max(0, $nowUtc->diffInMinutes($start, false));

                $cost = round(($minutes / 60) * (float) $session->rate_php, 2);

                $session->time_used_minutes = $minutes;
                $session->estimated_cost = $cost;

                return $session;
            });


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
