<?php

namespace App\Http\Controllers;

use App\Models\Pc;
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
}
