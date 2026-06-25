<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'total_amount',
        'status',
        'payment_method',
        'payment_deadline',
        'paid_at'
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'payment_deadline' => 'datetime',
        'paid_at' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function queue()
    {
        return $this->hasOne(Queue::class);
    }

    public function transaction()
    {
        return $this->hasOne(Transaction::class);
    }
}
