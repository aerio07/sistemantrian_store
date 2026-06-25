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
}
