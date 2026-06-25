<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Queue extends Model
{
    protected $fillable = [
        'queue_number',
        'token',
        'customer_name',
        'status',
        'cashier_id',
        'order_id',
        'queue_date',
        'processing_at',
        'called_at',
        'completed_at'
    ];

    protected $casts = [
        'queue_date' => 'date',
        'processing_at' => 'datetime',
        'called_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function logs()
    {
        return $this->hasMany(QueueLog::class);
    }

    /**
     * Get the position of this queue in today's waiting list.
     */
    public function getPositionAttribute()
    {
        if ($this->status !== 'waiting') {
            return 0;
        }

        return self::where('status', 'waiting')
            ->whereDate('queue_date', today())
            ->where('created_at', '<', $this->created_at)
            ->count() + 1;
    }
}
