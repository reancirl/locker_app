<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\PcViewController;
use App\Http\Controllers\SessionViewController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\PosSaleController;
use App\Http\Controllers\CashMovementController;
use App\Http\Controllers\MoneyController;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified', 'cashier.restrict'])
    ->name('dashboard');

Route::middleware(['auth', 'verified', 'cashier.restrict'])->group(function () {
    Route::get('pcs', [PcViewController::class, 'index'])->name('pcs.index');
    Route::patch('pcs/{pc}/minutes', [PcViewController::class, 'updateMinutes'])->name('pcs.minutes');
    Route::post('pcs/{pc}/sessions/start', [PcViewController::class, 'startSession'])->name('pcs.sessions.start');
    Route::post('pcs/{pc}/sessions/test', [PcViewController::class, 'startTestSession'])->name('pcs.sessions.test');
    Route::post('pcs/{pc}/command', [PcViewController::class, 'sendCommand'])->name('pcs.command');
    Route::get('sessions', [SessionViewController::class, 'index'])->name('sessions.index');
    Route::post('sessions/{session}/end', [SessionViewController::class, 'end'])->name('sessions.end');
    Route::post('sessions/{session}/clear', [SessionViewController::class, 'clear'])->name('sessions.clear');
    Route::get('products', [ProductController::class, 'index'])->name('products.index');
    Route::post('products', [ProductController::class, 'store'])->name('products.store');
    Route::patch('products/{product}/inventory', [ProductController::class, 'updateInventory'])->name('products.inventory');
    Route::get('pos', [PosController::class, 'index'])->name('pos.index');
    Route::post('pos/sales', [PosSaleController::class, 'store'])->name('pos.sales.store');
    Route::post('pos/cash-movements', [CashMovementController::class, 'store'])->name('pos.cash.store');
    Route::get('money', [MoneyController::class, 'index'])->name('money.index');
});

require __DIR__.'/settings.php';
