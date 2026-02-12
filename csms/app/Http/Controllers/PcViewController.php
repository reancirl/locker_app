<?php

namespace App\Http\Controllers;

use App\Models\Pc;
use App\Models\CafeSession;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PcViewController extends Controller
{
    public function index(): Response
    {
        $now = Carbon::now('Asia/Manila');

        $pcs = Pc::orderBy('device_id')
            ->get(['id', 'device_id', 'name', 'default_minutes', 'unlocked_until', 'last_seen_at', 'created_at']);

        $activeSessions = CafeSession::where(function ($query) use ($now) {
                $query->where('is_open', true)
                    ->orWhere('ends_at', '>', $now);
            })
            ->orderByDesc('started_at')
            ->get(['device_id', 'started_at', 'ends_at', 'is_open'])
            ->unique('device_id')
            ->keyBy('device_id');

        $pcs->transform(function ($pc) use ($activeSessions) {
            $session = $activeSessions->get($pc->device_id);
            $pc->active_session = $session ? [
                'is_open' => (bool) $session->is_open,
                'started_at' => $session->started_at?->toIso8601String(),
                'ends_at' => $session->ends_at?->toIso8601String(),
            ] : null;
            return $pc;
        });

        return Inertia::render('pcs/index', [
            'pcs' => $pcs,
        ]);
    }

    public function updateMinutes(Request $request, Pc $pc): RedirectResponse
    {
        $data = $request->validate([
            'default_minutes' => 'required|integer|min:1|max:480',
        ]);

        $pc->default_minutes = $data['default_minutes'];
        $pc->save();

        return back()->with('success', 'Default minutes updated.');
    }

    public function startSession(Request $request, Pc $pc): RedirectResponse
    {
        $data = $request->validate([
            'minutes' => 'nullable|integer|min:1|max:480',
            'open' => 'nullable|boolean',
        ]);

        $now = Carbon::now('Asia/Manila');
        $isOpen = (bool) ($data['open'] ?? false);
        if (!$isOpen && empty($data['minutes'])) {
            return back()->withErrors(['minutes' => 'Minutes is required unless open time is selected.']);
        }
        $endsAt = $isOpen ? $now : $now->copy()->addMinutes($data['minutes']);

        CafeSession::create([
            'device_id' => $pc->device_id,
            'user_id' => null,
            'started_at' => $now,
            'ends_at' => $endsAt,
            'is_open' => $isOpen,
            'rate_type' => 'walkin',
            'rate_php' => 15,
        ]);

        $pc->unlocked_until = $isOpen ? null : $endsAt;
        $pc->last_seen_at = $now;
        $pc->save();

        $message = $isOpen
            ? "Open session started for {$pc->device_id}"
            : "Session started for {$pc->device_id} until {$endsAt->toDateTimeString()}";

        return back()->with('success', $message);
    }
}
