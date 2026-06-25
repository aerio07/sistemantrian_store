<?php

namespace App\Http\Controllers;

use App\Models\Queue;
use App\Models\QueueLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class QueueController extends Controller
{
    // Ambil nomor antrian
    public function takeQueue(Request $request)
    {
        $todayCount = Queue::whereDate('queue_date', today())->count();

        $queueNumber = 'A' . str_pad($todayCount + 1, 3, '0', STR_PAD_LEFT);

        $queue = Queue::create([
            'queue_number' => $queueNumber,
            'customer_name' => $request->customer_name,
            'queue_date' => today(),
            'status' => 'waiting'
        ]);

        QueueLog::create([
            'queue_id' => $queue->id,
            'old_status' => null,
            'new_status' => 'waiting',
            'changed_by' => null
        ]);

        return response()->json([
            'message' => 'Queue created successfully',
            'data' => $queue
        ]);
    }

    // Panggil antrian berikutnya (FIFO)
    public function callNext()
{
    // cek apakah kasir masih punya antrean aktif
    $activeQueue = Queue::where('cashier_id', Auth::id())
        ->whereIn('status', ['called', 'processing'])
        ->first();

    if ($activeQueue) {
        return response()->json([
            'message' => 'Selesaikan antrean aktif terlebih dahulu'
        ], 400);
    }

    // ambil antrean berikutnya (FIFO)
    $queue = Queue::where('status', 'waiting')
        ->whereDate('queue_date', today())
        ->orderBy('created_at', 'asc')
        ->first();

    if (!$queue) {
        return response()->json([
            'message' => 'No queue available'
        ], 404);
    }

    $oldStatus = $queue->status;

    $queue->update([
        'status' => 'waiting_payment',
        'cashier_id' => Auth::id(),
        'called_at' => now()
    ]);

    QueueLog::create([
        'queue_id' => $queue->id,
        'old_status' => $oldStatus,
        'new_status' => 'waiting_payment',
        'changed_by' => Auth::id()
    ]);

    return response()->json($queue);
}

    public function completeQueue($id)
    {
        $queue = Queue::findOrFail($id);

        $oldStatus = $queue->status;

        $queue->update([
            'status' => 'completed',
            'completed_at' => now()
        ]);

        QueueLog::create([
            'queue_id' => $queue->id,
            'old_status' => $oldStatus,
            'new_status' => 'completed',
            'changed_by' => Auth::id()
        ]);

        return response()->json($queue);
    }
}