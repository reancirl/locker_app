<?php

namespace App\Http\Controllers;

use App\Models\CafeSession;
use App\Models\Pc;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $now = Carbon::now('Asia/Manila');
        $startOfWeek = $now->copy()->startOfWeek(Carbon::MONDAY);
        $onlineThreshold = $now->copy()->subMinutes(5);

        $sessionsForRevenue = CafeSession::with('pc:id,device_id,name')
            ->where('started_at', '<=', $now)
            ->where(function ($query) use ($startOfWeek) {
                $query->where('is_open', true)
                    ->orWhere('ends_at', '>=', $startOfWeek);
            })
            ->get(['id', 'device_id', 'started_at', 'ends_at', 'is_open', 'rate_php']);

        $totalMinutes = 0;
        $totalRevenue = 0;
        $perPc = [];

        foreach ($sessionsForRevenue as $session) {
            $sessionStart = $session->started_at ?? $startOfWeek;
            $effectiveStart = $sessionStart->greaterThan($startOfWeek) ? $sessionStart : $startOfWeek;

            $endCandidate = $session->is_open ? $now : ($session->ends_at ?? $now);
            $effectiveEnd = $endCandidate->lessThan($now) ? $endCandidate : $now;

            if ($effectiveEnd->lessThan($effectiveStart)) {
                continue;
            }

            $minutes = $effectiveStart->diffInMinutes($effectiveEnd);
            if ($minutes <= 0) {
                continue;
            }

            $revenue = ($minutes / 60) * $session->rate_php;
            $totalMinutes += $minutes;
            $totalRevenue += $revenue;

            $deviceId = $session->device_id;
            if (!isset($perPc[$deviceId])) {
                $perPc[$deviceId] = [
                    'device_id' => $deviceId,
                    'name' => $session->pc?->name,
                    'minutes' => 0,
                    'revenue' => 0,
                ];
            }
            $perPc[$deviceId]['minutes'] += $minutes;
            $perPc[$deviceId]['revenue'] += $revenue;
        }

        $sessionsStartedThisWeek = CafeSession::where('started_at', '>=', $startOfWeek)
            ->where('started_at', '<=', $now)
            ->get(['started_at', 'ends_at', 'is_open']);

        $sessionsCount = $sessionsStartedThisWeek->count();
        $totalSessionMinutes = 0;
        foreach ($sessionsStartedThisWeek as $session) {
            $end = $session->is_open ? $now : ($session->ends_at ?? $now);
            $minutes = $session->started_at
                ? max(0, $session->started_at->diffInMinutes($end))
                : 0;
            $totalSessionMinutes += $minutes;
        }
        $avgMinutes = $sessionsCount > 0 ? $totalSessionMinutes / $sessionsCount : 0;

        $activeSessions = CafeSession::whereNull('cleared_at')
            ->where(function ($query) use ($now) {
                $query->where('is_open', true)
                    ->orWhere('ends_at', '>', $now);
            })
            ->count();

        $openSessions = CafeSession::whereNull('cleared_at')
            ->where('is_open', true)
            ->count();

        $overdueSessionsCount = CafeSession::whereNull('cleared_at')
            ->where('is_open', false)
            ->where('ends_at', '<=', $now)
            ->whereHas('pc', function ($query) use ($onlineThreshold) {
                $query->where('last_seen_at', '>=', $onlineThreshold);
            })
            ->count();

        $totalPcs = Pc::count();
        $onlinePcs = Pc::where('last_seen_at', '>=', $onlineThreshold)->count();
        $offlinePcs = max(0, $totalPcs - $onlinePcs);

        $topPcs = collect($perPc)
            ->sortByDesc('revenue')
            ->take(5)
            ->values()
            ->all();

        $overdueSessions = CafeSession::with('pc:id,device_id,name,last_seen_at')
            ->whereNull('cleared_at')
            ->where('is_open', false)
            ->where('ends_at', '<=', $now)
            ->whereHas('pc', function ($query) use ($onlineThreshold) {
                $query->where('last_seen_at', '>=', $onlineThreshold);
            })
            ->orderBy('ends_at')
            ->limit(5)
            ->get(['id', 'device_id', 'ends_at']);

        return Inertia::render('dashboard', [
            'range' => [
                'start' => $startOfWeek->toIso8601String(),
                'end' => $now->toIso8601String(),
            ],
            'totals' => [
                'sales' => round($totalRevenue, 2),
                'sessions' => $sessionsCount,
                'avg_minutes' => round($avgMinutes, 1),
                'total_minutes' => $totalMinutes,
            ],
            'counts' => [
                'active_sessions' => $activeSessions,
                'open_sessions' => $openSessions,
                'overdue_sessions' => $overdueSessionsCount,
                'online_pcs' => $onlinePcs,
                'offline_pcs' => $offlinePcs,
                'total_pcs' => $totalPcs,
            ],
            'top_pcs' => $topPcs,
            'overdue_sessions' => $overdueSessions->map(function ($session) {
                return [
                    'id' => $session->id,
                    'device_id' => $session->device_id,
                    'name' => $session->pc?->name,
                    'ends_at' => $session->ends_at?->toIso8601String(),
                    'last_seen_at' => $session->pc?->last_seen_at?->toIso8601String(),
                ];
            }),
        ]);
    }
}
