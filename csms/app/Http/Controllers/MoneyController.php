<?php

namespace App\Http\Controllers;

use App\Models\CafeSession;
use App\Models\CashMovement;
use App\Models\PosSale;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class MoneyController extends Controller
{
    public function index(Request $request): Response
    {
        $now = Carbon::now('Asia/Manila');
        [$rangeStart, $rangeEnd] = $this->resolveDateRange($request, $now);

        $sessions = CafeSession::with('pc:id,device_id,name')
            ->where('is_test', false)
            ->where('started_at', '<=', $rangeEnd)
            ->where(function ($query) use ($rangeStart) {
                $query->where('is_open', true)
                    ->orWhere('ends_at', '>=', $rangeStart);
            })
            ->get(['id', 'device_id', 'started_at', 'ends_at', 'is_open', 'rate_php']);

        $rows = [];
        $cursor = $rangeStart->copy()->startOfDay();
        $lastDay = $rangeEnd->copy()->startOfDay();

        while ($cursor->lte($lastDay)) {
            $dayStart = $cursor->copy()->startOfDay();
            $dayEnd = $cursor->isSameDay($now) ? $now->copy() : $cursor->copy()->endOfDay();
            if ($dayEnd->gt($rangeEnd)) {
                $dayEnd = $rangeEnd->copy();
            }

            [, $pcRevenue] = $this->calculateRevenue($sessions, $dayStart, $dayEnd, $now);
            $posRevenue = (float) PosSale::whereBetween('created_at', [$dayStart, $dayEnd])->sum('total');

            $cashIn = (float) CashMovement::whereBetween('created_at', [$dayStart, $dayEnd])
                ->where('type', 'cash_in')
                ->sum('amount');
            $cashOut = (float) CashMovement::whereBetween('created_at', [$dayStart, $dayEnd])
                ->where('type', 'cash_out')
                ->sum('amount');
            $remittance = (float) CashMovement::whereBetween('created_at', [$dayStart, $dayEnd])
                ->where('type', 'remittance')
                ->sum('amount');

            $totalSales = $pcRevenue + $posRevenue;
            $totalCash = $totalSales + $cashIn - $cashOut - $remittance;

            $rows[] = [
                'date' => $dayStart->toDateString(),
                'pc_sales' => round($pcRevenue, 2),
                'food_sales' => round($posRevenue, 2),
                'cash_in' => round($cashIn, 2),
                'cash_out' => round($cashOut, 2),
                'total_sales' => round($totalSales, 2),
                'remittance' => round($remittance, 2),
                'total_cash' => round($totalCash, 2),
            ];

            $cursor->addDay();
        }

        return Inertia::render('money/index', [
            'range' => [
                'start' => $rangeStart->toDateString(),
                'end' => $rangeEnd->toDateString(),
            ],
            'rows' => $rows,
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

    private function calculateRevenue($sessions, Carbon $rangeStart, Carbon $rangeEnd, Carbon $now): array
    {
        $totalMinutes = 0;
        $totalRevenue = 0;

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
        }

        return [$totalMinutes, $totalRevenue];
    }
}
