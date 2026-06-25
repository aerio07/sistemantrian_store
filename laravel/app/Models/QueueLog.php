<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QueueLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'queue_id',
        'old_status',
        'new_status',
        'changed_by'
    ];
    public function queue()
    {
        return $this->belongsTo(Queue::class);
    }
}
