<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Queue;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function checkout(Request $request)
    {
        $cart = $request->cart;

        $total = collect($cart)->sum(function ($item) {
            return $item['price'];
        });

        // Create order
        $order = Order::create([
            'total_amount' => $total,
            'status' => 'waiting'
        ]);

        // Save items
        foreach ($cart as $item) {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $item['id'],
                'quantity' => 1,
                'price' => $item['price'],
                'subtotal' => $item['price']
            ]);
        }

        // Generate queue
        $todayCount = Queue::whereDate('queue_date', today())->count();

        $queueNumber = 'A' . str_pad($todayCount + 1, 3, '0', STR_PAD_LEFT);

        $queue = Queue::create([
            'order_id' => $order->id,
            'queue_number' => $queueNumber,
            'status' => 'waiting',
            'queue_date' => today()
        ]);

        return response()->json([
            'order' => $order,
            'queue' => $queue
        ]);
    }
}