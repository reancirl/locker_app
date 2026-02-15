<?php

namespace App\Http\Controllers;

use App\Models\CafeSession;
use App\Models\Pc;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $now = Carbon::now('Asia/Manila');
        $onlineThreshold = $now->copy()->subMinutes(5);

        [$rangeStart, $rangeEnd] = $this->resolveDateRange($request, $now);

        $sessionsForRevenue = CafeSession::with('pc:id,device_id,name')
            ->where('is_test', false)
            ->where('started_at', '<=', $rangeEnd)
            ->where(function ($query) use ($rangeStart) {
                $query->where('is_open', true)
                    ->orWhere('ends_at', '>=', $rangeStart);
            })
            ->get(['id', 'device_id', 'started_at', 'ends_at', 'is_open', 'rate_php']);

        [$totalMinutes, $totalRevenue, $perPc] = $this->calculateRevenue($sessionsForRevenue, $rangeStart, $rangeEnd, $now);

        $sessionsStartedInRange = CafeSession::where('is_test', false)
            ->where('started_at', '>=', $rangeStart)
            ->where('started_at', '<=', $rangeEnd)
            ->get(['started_at', 'ends_at', 'is_open']);

        $sessionsCount = $sessionsStartedInRange->count();
        $totalSessionMinutes = 0;
        foreach ($sessionsStartedInRange as $session) {
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

        $todayStart = $now->copy()->startOfDay();
        $todayEnd = $now->copy();
        $sessionsForToday = CafeSession::with('pc:id,device_id,name')
            ->where('is_test', false)
            ->where('started_at', '<=', $todayEnd)
            ->where(function ($query) use ($todayStart) {
                $query->where('is_open', true)
                    ->orWhere('ends_at', '>=', $todayStart);
            })
            ->get(['id', 'device_id', 'started_at', 'ends_at', 'is_open', 'rate_php']);
        [$todayMinutes, $todayRevenue] = $this->calculateRevenue($sessionsForToday, $todayStart, $todayEnd, $now, false);

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
                'start' => $rangeStart->toIso8601String(),
                'end' => $rangeEnd->toIso8601String(),
            ],
            'filter' => [
                'start' => $rangeStart->toDateString(),
                'end' => $rangeEnd->toDateString(),
            ],
            'totals' => [
                'sales' => round($totalRevenue, 2),
                'sales_today' => round($todayRevenue, 2),
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

    private function resolveDateRange(Request $request, Carbon $now): array
    {
        $start = $request->query('start');
        $end = $request->query('end');

        if ($start || $end) {
            try {
                $parsedStart = $start ? Carbon::parse($start, 'Asia/Manila')->startOfDay() : $now->copy()->startOfWeek(Carbon::MONDAY);
                $parsedEnd = $end ? Carbon::parse($end, 'Asia/Manila')->endOfDay() : $now->copy()->endOfDay();
            } catch (\Exception $e) {
                $parsedStart = $now->copy()->startOfWeek(Carbon::MONDAY);
                $parsedEnd = $now->copy()->endOfDay();
            }
        } else {
            $parsedStart = $now->copy()->startOfWeek(Carbon::MONDAY);
            $parsedEnd = $now->copy()->endOfDay();
        }

        if ($parsedEnd->lessThan($parsedStart)) {
            [$parsedStart, $parsedEnd] = [$parsedEnd->copy()->startOfDay(), $parsedStart->copy()->endOfDay()];
        }

        if ($parsedEnd->greaterThan($now)) {
            $parsedEnd = $now->copy();
        }

        return [$parsedStart, $parsedEnd];
    }

    private function calculateRevenue($sessions, Carbon $rangeStart, Carbon $rangeEnd, Carbon $now, bool $withPerPc = true): array
    {
        $totalMinutes = 0;
        $totalRevenue = 0;
        $perPc = [];

        foreach ($sessions as $session) {
            $sessionStart = $session->started_at ?? $rangeStart;
            $effectiveStart = $sessionStart->greaterThan($rangeStart) ? $sessionStart : $rangeStart;

            $endCandidate = $session->is_open ? $now : ($session->ends_at ?? $now);
            $effectiveEnd = $endCandidate->lessThan($rangeEnd) ? $endCandidate : $rangeEnd;

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

            if ($withPerPc) {
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
        }

        return [$totalMinutes, $totalRevenue, $perPc];
    }
}
