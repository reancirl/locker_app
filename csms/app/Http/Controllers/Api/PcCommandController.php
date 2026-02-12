<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PcCommand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class PcCommandController extends Controller
{
    public function ack(Request $request, string $deviceId, PcCommand $pcCommand): JsonResponse
    {
        if ($pcCommand->device_id !== $deviceId) {
            return response()->json(['ok' => false, 'message' => 'Command not found'], 404);
        }

        $data = $request->validate([
            'status' => 'required|string|max:32',
            'message' => 'nullable|string|max:255',
        ]);

        $pcCommand->result = $data['status'];
        $pcCommand->message = $data['message'] ?? null;
        $pcCommand->executed_at = Carbon::now('Asia/Manila');
        $pcCommand->save();

        return response()->json(['ok' => true]);
    }
}
