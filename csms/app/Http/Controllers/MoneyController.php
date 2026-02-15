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
        $date = $this->resolveDate($request, $now);
        $rangeStart = $date->copy()->startOfDay();
        $rangeEnd = $date->copy()->endOfDay();

        $sessions = CafeSession::with('pc:id,device_id,name')
            ->where('is_test', false)
            ->where('started_at', '<=', $rangeEnd)
            ->where(function ($query) use ($rangeStart) {
                $query->where('is_open', true)
                    ->orWhere('ends_at', '>=', $rangeStart);
            })
            ->get(['id', 'device_id', 'started_at', 'ends_at', 'is_open', 'rate_php']);

        [, $pcRevenue] = $this->calculateRevenue($sessions, $rangeStart, $rangeEnd, $now);

        $posRevenue = (float) PosSale::whereBetween('created_at', [$rangeStart, $rangeEnd])->sum('total');

        $cashIn = (float) CashMovement::whereBetween('created_at', [$rangeStart, $rangeEnd])
            ->where('type', 'cash_in')
            ->sum('amount');
        $cashOut = (float) CashMovement::whereBetween('created_at', [$rangeStart, $rangeEnd])
            ->where('type', 'cash_out')
            ->sum('amount');
        $remittance = (float) CashMovement::whereBetween('created_at', [$rangeStart, $rangeEnd])
            ->where('type', 'remittance')
            ->sum('amount');

        $totalSales = $pcRevenue + $posRevenue;
        $totalCash = $totalSales + $cashIn - $cashOut - $remittance;

        return Inertia::render('money/index', [
            'date' => $date->toDateString(),
            'totals' => [
                'pc_sales' => round($pcRevenue, 2),
                'food_sales' => round($posRevenue, 2),
                'total_sales' => round($totalSales, 2),
                'cash_in' => round($cashIn, 2),
                'cash_out' => round($cashOut, 2),
                'remittance' => round($remittance, 2),
                'total_cash' => round($totalCash, 2),
            ],
        ]);
    }

    private function resolveDate(Request $request, Carbon $now): Carbon
    {
        $date = $request->query('date');
        if ($date) {
            try {
                return Carbon::parse($date, 'Asia/Manila');
            } catch (\Exception $e) {
                return $now->copy();
            }
        }

        return $now->copy();
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
