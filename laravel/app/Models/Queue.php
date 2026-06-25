<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Queue extends Model
{
    protected $fillable = [
        'queue_number',
        'customer_name',
        'status',
        'cashier_id',
        'queue_date',
        'processing_at',
        'called_at',
        'completed_at'
    ];
    public function logs()
    {
        return $this->hasMany(QueueLog::class);
    }
}
