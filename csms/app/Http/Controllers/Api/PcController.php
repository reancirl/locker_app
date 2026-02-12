<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CafeSession;
use App\Models\Pc;
use App\Models\PcCommand;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class PcController extends Controller
{
    private array $defaultWarnings = [300, 60];

    public function state(string $deviceId): JsonResponse
    {
        $now = Carbon::now('Asia/Manila');
        $pc = Pc::firstOrCreate(['device_id' => $deviceId]);
        $pc->last_seen_at = $now;
        $pc->save();

        $session = CafeSession::where('device_id', $deviceId)
            ->where(function ($query) use ($now) {
                $query->where('is_open', true)
                    ->orWhere('ends_at', '>', $now); // strictly in the future
            })
            ->orderByDesc('is_open')
            ->orderByDesc('started_at')
            ->first();

        $command = PcCommand::where('device_id', $deviceId)
            ->whereNull('executed_at')
            ->orderBy('created_at')
            ->first();

        // If no active session, lock and clear cached unlock
        if (!$session) {
            if ($pc->unlocked_until) {
                $pc->unlocked_until = null;
                $pc->save();
            }
            return response()->json([
                'mode' => 'locked',
                'command' => $command ? [
                    'id' => $command->id,
                    'action' => $command->command,
                ] : null,
                'is_open' => false,
            ]);
        }

        if ($session->is_open) {
            if ($pc->unlocked_until) {
                $pc->unlocked_until = null;
                $pc->save();
            }
            return response()->json([
                'mode' => 'open',
                'session_id' => $session?->id,
                'unlocked_until' => null,
                'warnings' => [],
                'is_open' => true,
                'command' => $command ? [
                    'id' => $command->id,
                    'action' => $command->command,
                ] : null,
            ]);
        }

        $unlockedUntil = $session->ends_at;

        // keep pc cache in sync
        if (!$pc->unlocked_until || !$pc->unlocked_until->equalTo($unlockedUntil)) {
            $pc->unlocked_until = $unlockedUntil;
            $pc->save();
        }

        return response()->json([
            'mode' => 'unlocked',
            'session_id' => $session?->id,
            'unlocked_until' => $unlockedUntil->toIso8601String(),
            'warnings' => $this->defaultWarnings,
            'is_open' => false,
            'command' => $command ? [
                'id' => $command->id,
                'action' => $command->command,
            ] : null,
        ]);
    }
}
