<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CafeSession;
use App\Models\Pc;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class SessionController extends Controller
{
    private int $defaultMinutes = 60;
    private int $walkInRate = 15;

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'device_id' => 'required|string',
            'minutes' => 'nullable|integer|min:1|max:480',
            'open' => 'nullable|boolean',
        ]);

        $now = Carbon::now('Asia/Manila');
        $pc = Pc::firstOrCreate(['device_id' => $data['device_id']]);

        $isOpen = filter_var($data['open'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $minutes = $isOpen ? null : ($data['minutes'] ?? $pc->default_minutes ?? $this->defaultMinutes);
        $endsAt = $isOpen ? $now : $now->copy()->addMinutes($minutes);

        $session = CafeSession::create([
            'device_id' => $pc->device_id,
            'user_id' => null,
            'started_at' => $now,
            'ends_at' => $endsAt,
            'is_open' => $isOpen,
            'rate_type' => 'walkin',
            'rate_php' => $this->walkInRate,
        ]);

        $pc->unlocked_until = $isOpen ? null : $endsAt;
        $pc->last_seen_at = $now;
        $pc->save();

        return response()->json([
            'ok' => true,
            'session_id' => $session->id,
            'unlocked_until' => $isOpen ? null : $endsAt->toIso8601String(),
            'is_open' => $isOpen,
        ]);
    }

    public function startWalkIn(Request $request): JsonResponse
    {
        $data = $request->validate([
            'device_id' => 'required|string',
            'minutes' => 'nullable|integer|min:1',
            'open' => 'nullable|boolean',
        ]);

        $now = Carbon::now('Asia/Manila');
        $pc = Pc::firstOrCreate(['device_id' => $data['device_id']]);

        $isOpen = filter_var($data['open'] ?? false, FILTER_VALIDATE_BOOLEAN);
        if (!$isOpen && empty($data['minutes'])) {
            return response()->json(['ok' => false, 'message' => 'Minutes is required unless open is true'], 422);
        }
        $endsAt = $isOpen ? $now : $now->copy()->addMinutes($data['minutes']);

        $session = CafeSession::create([
            'device_id' => $pc->device_id,
            'user_id' => null,
            'started_at' => $now,
            'ends_at' => $endsAt,
            'is_open' => $isOpen,
            'rate_type' => 'walkin',
            'rate_php' => $this->walkInRate,
        ]);

        $pc->unlocked_until = $isOpen ? null : $endsAt;
        $pc->last_seen_at = $now;
        $pc->save();

        return response()->json([
            'ok' => true,
            'session_id' => $session->id,
            'unlocked_until' => $isOpen ? null : $endsAt->toIso8601String(),
            'is_open' => $isOpen,
        ]);
    }

    public function endSession(int $sessionId): JsonResponse
    {
        $now = Carbon::now('Asia/Manila');
        $session = CafeSession::find($sessionId);
        if (!$session) {
            return response()->json(['ok' => false, 'message' => 'Session not found'], 404);
        }

        $session->ends_at = $now;
        $session->is_open = false;
        $session->save();

        $pc = Pc::firstOrCreate(['device_id' => $session->device_id]);
        $pc->unlocked_until = $now;
        $pc->last_seen_at = $now;
        $pc->save();

        return response()->json(['ok' => true]);
    }
}
