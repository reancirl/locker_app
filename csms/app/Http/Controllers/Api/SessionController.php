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
        ]);

        $now = Carbon::now('Asia/Manila');
        $pc = Pc::firstOrCreate(['device_id' => $data['device_id']]);

        $minutes = $data['minutes'] ?? $pc->default_minutes ?? $this->defaultMinutes;
        $endsAt = $now->copy()->addMinutes($minutes);

        $session = CafeSession::create([
            'device_id' => $pc->device_id,
            'user_id' => null,
            'started_at' => $now,
            'ends_at' => $endsAt,
            'rate_type' => 'walkin',
            'rate_php' => $this->walkInRate,
        ]);

        $pc->unlocked_until = $endsAt;
        $pc->last_seen_at = $now;
        $pc->save();

        return response()->json([
            'ok' => true,
            'session_id' => $session->id,
            'unlocked_until' => $endsAt->toIso8601String(),
        ]);
    }

    public function startWalkIn(Request $request): JsonResponse
    {
        $data = $request->validate([
            'device_id' => 'required|string',
            'minutes' => 'required|integer|min:1',
        ]);

        $now = Carbon::now('Asia/Manila');
        $pc = Pc::firstOrCreate(['device_id' => $data['device_id']]);

        $endsAt = $now->copy()->addMinutes($data['minutes']);

        $session = CafeSession::create([
            'device_id' => $pc->device_id,
            'user_id' => null,
            'started_at' => $now,
            'ends_at' => $endsAt,
            'rate_type' => 'walkin',
            'rate_php' => $this->walkInRate,
        ]);

        $pc->unlocked_until = $endsAt;
        $pc->last_seen_at = $now;
        $pc->save();

        return response()->json([
            'ok' => true,
            'session_id' => $session->id,
            'unlocked_until' => $endsAt->toIso8601String(),
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
        $session->save();

        $pc = Pc::firstOrCreate(['device_id' => $session->device_id]);
        $pc->unlocked_until = $now;
        $pc->last_seen_at = $now;
        $pc->save();

        return response()->json(['ok' => true]);
    }
}
