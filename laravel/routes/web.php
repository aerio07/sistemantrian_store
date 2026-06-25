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

// =============================================
// GUEST (User) Routes
// =============================================
Route::get('/shop', [ShopController::class, 'index']);
Route::post('/checkout', [OrderController::class, 'checkout']);
Route::get('/waiting/{token}', [QueueController::class, 'waitingPage']);
Route::get('/payment/{token}', [QueueController::class, 'paymentPage']);
Route::post('/payment/{token}/select', [QueueController::class, 'selectPayment']);
Route::get('/pickup/{token}', [QueueController::class, 'pickupPage']);

// API — Polling (Guest, no auth needed)
Route::get('/api/queue/status/{token}', [QueueController::class, 'status']);

// =============================================
// KASIR Routes (Auth Required)
// =============================================
Route::middleware('auth')->prefix('cashier')->group(function () {
    Route::get('/', [QueueController::class, 'cashierDashboard']);
    Route::get('/api/queues', [QueueController::class, 'cashierQueues']);
    Route::post('/queue/call-next', [QueueController::class, 'callNext']);
    Route::post('/queue/{id}/confirm-payment', [QueueController::class, 'confirmPayment']);
    Route::post('/queue/{id}/send-receipt', [QueueController::class, 'sendReceipt']);
    Route::post('/queue/{id}/pickup', [QueueController::class, 'confirmPickup']);
    Route::post('/queue/{id}/skip', [QueueController::class, 'skipQueue']);
});

// =============================================
// PUBLIC — Display Queue (for monitor/TV)
// =============================================
Route::get('/display', [QueueController::class, 'displayPage']);
Route::get('/api/display', [QueueController::class, 'displayData']);

require __DIR__.'/auth.php';
