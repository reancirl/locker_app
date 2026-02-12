<?php

use App\Http\Controllers\Api\PcController;
use App\Http\Controllers\Api\PcCommandController;
use App\Http\Controllers\Api\SessionController;
use Illuminate\Support\Facades\Route;

Route::middleware('api')->group(function () {
    Route::get('/pcs/{deviceId}/state', [PcController::class, 'state']);
    Route::post('/pcs/{deviceId}/commands/{pcCommand}/ack', [PcCommandController::class, 'ack']);

    Route::post('/sessions/login', [SessionController::class, 'login']);
    Route::post('/sessions/walkin/start', [SessionController::class, 'startWalkIn']);
    Route::post('/sessions/{sessionId}/end', [SessionController::class, 'endSession']);
});
