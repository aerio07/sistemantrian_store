<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('queue_logs', function (Blueprint $table) {
    $table->id();

    $table->foreignId('queue_id')
        ->constrained('queues')
        ->cascadeOnDelete();

    // old_status dibuat nullable karena antrean baru tidak punya status lama
    $table->enum('old_status', [
    'waiting',
    'called',
    'waiting_payment',
    'paid',
    'ready_pickup',
    'completed',
    'cancelled',
    'expired',
    'skipped'
])->nullable();
    $table->enum('new_status', [
    'waiting',
    'called',
    'waiting_payment',
    'paid',
    'ready_pickup',
    'completed',
    'cancelled',
    'expired',
    'skipped'
]);

    // Menggunakan foreignId ke users untuk mencatat SIAPA yang mengubah status (misal: ID Kasir)
    $table->foreignId('changed_by')
        ->nullable()
        ->constrained('users')
        ->nullOnDelete();

    // Menggunakan single timestamp karena data log sifatnya insert-only (tidak pernah di-update)
    $table->timestamp('created_at')->useCurrent(); 
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('queue_logs');
    }
};
