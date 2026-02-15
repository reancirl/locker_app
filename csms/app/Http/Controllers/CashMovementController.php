<?php

namespace App\Http\Controllers;

use App\Models\CashMovement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CashMovementController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'type' => 'required|string|in:cash_in,cash_out,remittance',
            'amount' => 'required|numeric|min:0.01',
            'note' => 'nullable|string|max:255',
        ]);

        CashMovement::create([
            'type' => $data['type'],
            'amount' => $data['amount'],
            'note' => $data['note'] ?? null,
            'user_id' => $request->user()?->id,
        ]);

        return back()->with('success', 'Cash movement saved.');
    }
}
