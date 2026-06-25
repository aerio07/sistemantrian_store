<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'order_id',
        'total_amount',
        'payment_amount',
        'change_amount',
        'payment_method',
        'payment_status',
        'paid_at'
    ];
}