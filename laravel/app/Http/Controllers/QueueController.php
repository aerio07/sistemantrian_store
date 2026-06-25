<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Queue;
use App\Models\QueueLog;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class QueueController extends Controller
{
    // =============================================
    // GUEST (User) Pages
    // =============================================

    /**
     * Waiting page — user sees their queue number & position
     */
    public function waitingPage($token)
    {
        $queue = Queue::where('token', $token)->firstOrFail();

        return Inertia::render('Waiting/Index', [
            'token' => $token,
            'queue' => $queue->only(['id', 'queue_number', 'status']),
        ]);
    }

    /**
     * Payment selection page — user chooses Cash or QRIS
     */
    public function paymentPage($token)
    {
        $queue = Queue::where('token', $token)->with('order')->firstOrFail();

        return Inertia::render('Payment/Index', [
            'token' => $token,
            'queue' => $queue->only(['id', 'queue_number', 'status']),
            'order' => $queue->order ? $queue->order->only(['id', 'total_amount', 'payment_method', 'payment_deadline']) : null,
        ]);
    }

    /**
     * Pickup page — user picks up their order
     */
    public function pickupPage($token)
    {
        $queue = Queue::where('token', $token)->with('order.items.product')->firstOrFail();

        return Inertia::render('Pickup/Index', [
            'token' => $token,
            'queue' => $queue->only(['id', 'queue_number', 'status']),
            'order' => $queue->order,
        ]);
    }

    // =============================================
    // API — Polling endpoint for guest user
    // =============================================

    /**
     * Return current queue status + position (for polling)
     */
    public function status($token)
    {
        $queue = Queue::where('token', $token)->with('order')->firstOrFail();

        $waitingAhead = 0;
        if ($queue->status === 'waiting') {
            $waitingAhead = Queue::where('status', 'waiting')
                ->whereDate('queue_date', today())
                ->where('created_at', '<', $queue->created_at)
                ->count();
        }

        return response()->json([
            'queue_number' => $queue->queue_number,
            'status' => $queue->status,
            'position' => $waitingAhead + 1,
            'waiting_ahead' => $waitingAhead,
            'order' => $queue->order ? [
                'total_amount' => $queue->order->total_amount,
                'payment_method' => $queue->order->payment_method,
                'payment_deadline' => $queue->order->payment_deadline,
            ] : null,
        ]);
    }

    // =============================================
    // GUEST — Payment action
    // =============================================

    /**
     * User selects payment method (Cash / QRIS)
     */
    public function selectPayment(Request $request, $token)
    {
        $request->validate([
            'payment_method' => 'required|in:cash,qris',
        ]);

        $queue = Queue::where('token', $token)->firstOrFail();

        if (!in_array($queue->status, ['called', 'waiting_payment'])) {
            return response()->json(['message' => 'Status antrian tidak valid untuk memilih pembayaran'], 400);
        }

        $order = $queue->order;
        if (!$order) {
            return response()->json(['message' => 'Order tidak ditemukan'], 404);
        }

        // Set payment deadline (5 minutes from now)
        $order->update([
            'payment_method' => $request->payment_method,
            'payment_deadline' => now()->addMinutes(5),
            'status' => 'waiting_payment',
        ]);

        // Update queue status
        $oldStatus = $queue->status;
        $queue->update(['status' => 'waiting_payment']);

        if ($oldStatus !== 'waiting_payment') {
            QueueLog::create([
                'queue_id' => $queue->id,
                'old_status' => $oldStatus,
                'new_status' => 'waiting_payment',
                'changed_by' => null,
            ]);
        }

        return response()->json([
            'message' => 'Metode pembayaran dipilih',
            'payment_method' => $request->payment_method,
            'payment_deadline' => $order->fresh()->payment_deadline,
        ]);
    }

    // =============================================
    // KASIR — Queue management
    // =============================================

    /**
     * Cashier dashboard page
     */
    public function cashierDashboard()
    {
        return Inertia::render('Queue/CashierPanel');
    }

    /**
     * API: Get all queues for cashier dashboard
     */
    public function cashierQueues()
    {
        $todayQueues = Queue::whereDate('queue_date', today())
            ->with('order.items.product')
            ->orderBy('created_at', 'asc')
            ->get();

        // Current active queue for this cashier
        $activeQueue = Queue::where('cashier_id', Auth::id())
            ->whereIn('status', ['called', 'waiting_payment', 'paid', 'ready_pickup'])
            ->with('order.items.product')
            ->first();

        $stats = [
            'waiting' => $todayQueues->where('status', 'waiting')->count(),
            'completed' => $todayQueues->where('status', 'completed')->count(),
            'cancelled' => $todayQueues->where('status', 'cancelled')->count(),
            'total' => $todayQueues->count(),
        ];

        return response()->json([
            'queues' => $todayQueues,
            'active_queue' => $activeQueue,
            'stats' => $stats,
        ]);
    }

    /**
     * Cashier calls next queue (FIFO)
     */
    public function callNext()
    {
        // Check if cashier already has an active queue
        $activeQueue = Queue::where('cashier_id', Auth::id())
            ->whereIn('status', ['called', 'waiting_payment', 'paid', 'ready_pickup'])
            ->first();

        if ($activeQueue) {
            return response()->json([
                'message' => 'Selesaikan antrean aktif terlebih dahulu',
            ], 400);
        }

        // Get next waiting queue (FIFO)
        $queue = Queue::where('status', 'waiting')
            ->whereDate('queue_date', today())
            ->orderBy('created_at', 'asc')
            ->first();

        if (!$queue) {
            return response()->json([
                'message' => 'Tidak ada antrian',
            ], 404);
        }

        $oldStatus = $queue->status;

        $queue->update([
            'status' => 'called',
            'cashier_id' => Auth::id(),
            'called_at' => now(),
        ]);

        QueueLog::create([
            'queue_id' => $queue->id,
            'old_status' => $oldStatus,
            'new_status' => 'called',
            'changed_by' => Auth::id(),
        ]);

        return response()->json($queue->fresh()->load('order.items.product'));
    }

    /**
     * Cashier confirms payment
     */
    public function confirmPayment($id)
    {
        $queue = Queue::findOrFail($id);

        if (!in_array($queue->status, ['called', 'waiting_payment'])) {
            return response()->json(['message' => 'Status tidak valid untuk konfirmasi bayar'], 400);
        }

        $order = $queue->order;

        // Create transaction record
        Transaction::create([
            'order_id' => $order->id,
            'total_amount' => $order->total_amount,
            'payment_amount' => $order->total_amount,
            'change_amount' => 0,
            'payment_method' => $order->payment_method ?? 'cash',
            'payment_status' => 'paid',
            'paid_at' => now(),
        ]);

        // Update order
        $order->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        // Update queue
        $oldStatus = $queue->status;
        $queue->update(['status' => 'paid']);

        QueueLog::create([
            'queue_id' => $queue->id,
            'old_status' => $oldStatus,
            'new_status' => 'paid',
            'changed_by' => Auth::id(),
        ]);

        return response()->json($queue->fresh()->load('order'));
    }

    /**
     * Cashier sends receipt → ready for pickup
     */
    public function sendReceipt($id)
    {
        $queue = Queue::findOrFail($id);

        if ($queue->status !== 'paid') {
            return response()->json(['message' => 'Pembayaran belum dikonfirmasi'], 400);
        }

        $oldStatus = $queue->status;
        $queue->update(['status' => 'ready_pickup']);

        $queue->order->update(['status' => 'ready_pickup']);

        QueueLog::create([
            'queue_id' => $queue->id,
            'old_status' => $oldStatus,
            'new_status' => 'ready_pickup',
            'changed_by' => Auth::id(),
        ]);

        return response()->json($queue->fresh()->load('order'));
    }

    /**
     * Cashier confirms pickup → completed
     */
    public function confirmPickup($id)
    {
        $queue = Queue::findOrFail($id);

        if ($queue->status !== 'ready_pickup') {
            return response()->json(['message' => 'Status tidak valid'], 400);
        }

        $oldStatus = $queue->status;
        $queue->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        $queue->order->update(['status' => 'completed']);

        QueueLog::create([
            'queue_id' => $queue->id,
            'old_status' => $oldStatus,
            'new_status' => 'completed',
            'changed_by' => Auth::id(),
        ]);

        return response()->json(['message' => 'Antrian selesai']);
    }

    /**
     * Cashier skips queue
     */
    public function skipQueue($id)
    {
        $queue = Queue::findOrFail($id);

        $oldStatus = $queue->status;
        $queue->update([
            'status' => 'cancelled',
            'completed_at' => now(),
        ]);

        if ($queue->order) {
            $queue->order->update(['status' => 'cancelled']);
        }

        QueueLog::create([
            'queue_id' => $queue->id,
            'old_status' => $oldStatus,
            'new_status' => 'cancelled',
            'changed_by' => Auth::id(),
        ]);

        return response()->json(['message' => 'Antrian di-skip']);
    }

    // =============================================
    // PUBLIC — Display Queue
    // =============================================

    /**
     * Display queue page (for monitor/TV)
     */
    public function displayPage()
    {
        return Inertia::render('Queue/DisplayQueue');
    }

    /**
     * API: Get display data
     */
    public function displayData()
    {
        $currentlyServing = Queue::whereDate('queue_date', today())
            ->whereIn('status', ['called', 'waiting_payment', 'paid', 'ready_pickup'])
            ->with('cashier')
            ->orderBy('called_at', 'desc')
            ->get();

        $waitingList = Queue::where('status', 'waiting')
            ->whereDate('queue_date', today())
            ->orderBy('created_at', 'asc')
            ->get(['id', 'queue_number', 'created_at']);

        return response()->json([
            'serving' => $currentlyServing,
            'waiting' => $waitingList,
        ]);
    }
}