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
        $onlineThreshold = $now->copy()->subMinutes(5);

        $sessions = CafeSession::with(['user:id,username,name', 'pc:id,device_id,name,last_seen_at'])
            ->where(function ($query) use ($now, $onlineThreshold) {
                $query->where('is_open', true)
                    ->orWhere('ends_at', '>', $now)
                    ->orWhere(function ($sub) use ($now, $onlineThreshold) {
                        $sub->where('ends_at', '<=', $now)
                            ->whereHas('pc', function ($pcQuery) use ($onlineThreshold) {
                                $pcQuery->where('last_seen_at', '>=', $onlineThreshold);
                            });
                    });
            })
            ->orderByDesc('started_at')
            ->get([
                'id',
                'device_id',
                'user_id',
                'started_at',
                'ends_at',
                'is_open',
                'rate_type',
                'rate_php',
                'created_at',
            ])
            ->map(function ($session) use ($now, $onlineThreshold) {
                $minutes = $session->started_at
                    ? max(0, $session->started_at->diffInMinutes($now))
                    : 0;
                $session->time_used_minutes = $minutes;
                $session->estimated_cost = ($minutes / 60) * $session->rate_php;
                $session->is_overdue = false;
                if (!$session->is_open && $session->ends_at && $session->ends_at->lte($now)) {
                    $lastSeen = $session->pc?->last_seen_at;
                    if ($lastSeen && $lastSeen->gte($onlineThreshold)) {
                        $session->is_overdue = true;
                    }
                }
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
        $session->is_open = false;
        $session->save();

        $pc = Pc::firstOrCreate(['device_id' => $session->device_id]);
        $pc->unlocked_until = null; // clear cached unlock
        $pc->last_seen_at = $now;
        $pc->save();

        return back()->with('success', 'Session ended.');
    }
}
