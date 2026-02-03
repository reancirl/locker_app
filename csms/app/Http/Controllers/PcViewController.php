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
        $pcs = Pc::orderBy('device_id')
            ->get(['id', 'device_id', 'name', 'default_minutes', 'unlocked_until', 'last_seen_at', 'created_at']);

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
            'minutes' => 'required|integer|min:1|max:480',
        ]);

        $now = Carbon::now('Asia/Manila');
        $endsAt = $now->copy()->addMinutes($data['minutes']);

        CafeSession::create([
            'device_id' => $pc->device_id,
            'user_id' => null,
            'started_at' => $now,
            'ends_at' => $endsAt,
            'rate_type' => 'walkin',
            'rate_php' => 18,
        ]);

        $pc->unlocked_until = $endsAt;
        $pc->last_seen_at = $now;
        $pc->save();

        return back()->with('success', "Session started for {$pc->device_id} until {$endsAt->toDateTimeString()}");
    }
}
