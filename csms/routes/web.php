<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\PcViewController;
use App\Http\Controllers\SessionViewController;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('pcs', [PcViewController::class, 'index'])->name('pcs.index');
    Route::patch('pcs/{pc}/minutes', [PcViewController::class, 'updateMinutes'])->name('pcs.minutes');
    Route::get('sessions', [SessionViewController::class, 'index'])->name('sessions.index');
});

require __DIR__.'/settings.php';
