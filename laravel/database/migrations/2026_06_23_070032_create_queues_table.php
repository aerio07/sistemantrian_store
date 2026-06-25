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
        Schema::create('queues', function (Blueprint $table) {
    $table->id();
    
    // Hapus ->unique() agar nomor antrean bisa di-reset setiap hari
    $table->string('queue_number'); 
    
    $table->string('customer_name')->nullable();

    $table->enum('status', [
        'waiting',
        'called',
        'waiting_payment',
        'paid',
        'ready_pickup',
        'expired',
        'completed',
        'cancelled'
    ])->default('waiting');

    $table->foreignId('cashier_id')
        ->nullable()
        ->constrained('users')
        ->nullOnDelete();
    $table->date('queue_date')->useCurrent();
    // Tambahan pelengkap track waktu jika nanti dibutuhkan untuk status 'processing'
    $table->timestamp('processing_at')->nullable(); 
    $table->timestamp('called_at')->nullable();
    $table->timestamp('completed_at')->nullable();
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('queues');
    }
};
