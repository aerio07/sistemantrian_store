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
        Schema::create('orders', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

    $table->decimal('total_amount', 12, 2)->default(0);

    $table->enum('status', [
        'pending',
        'waiting',
        'called',
        'waiting_payment',
        'paid',
        'ready_pickup',
        'completed',
        'cancelled',
        'expired'
    ])->default('pending');

    $table->string('payment_method')->nullable();
    $table->timestamp('payment_deadline')->nullable();
    $table->timestamp('paid_at')->nullable();

    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
