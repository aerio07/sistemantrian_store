<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\QueueController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\OrderController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::post('/queue/take', [QueueController::class, 'takeQueue']);

Route::middleware('auth')->group(function () {
    Route::post('/queue/call-next', [QueueController::class, 'callNext']);
    Route::post('/queue/start/{id}', [QueueController::class, 'startProcess']);
    Route::post('/queue/complete/{id}', [QueueController::class, 'completeQueue']);
});

Route::get('/queue', function () {
    return Inertia::render('Queue/TakeQueue');
});

Route::get('/cashier', function () {
    return Inertia::render('Queue/CashierPanel');
})->middleware('auth');

Route::get('/shop', [ShopController::class, 'index']);
Route::post('/checkout', [OrderController::class, 'checkout']);
Route::get('/waiting/{id}', function ($id) {
    return Inertia::render('Waiting/Index');
});

require __DIR__.'/auth.php';
