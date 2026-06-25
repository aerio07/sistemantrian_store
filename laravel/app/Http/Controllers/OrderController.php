<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Queue;
use App\Models\QueueLog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function checkout(Request $request)
    {
        $request->validate([
            'cart' => 'required|array|min:1',
            'cart.*.id' => 'required|exists:products,id',
            'cart.*.quantity' => 'required|integer|min:1',
        ]);

        $cart = $request->cart;

        // Calculate total from DB prices (don't trust client prices)
        $productIds = collect($cart)->pluck('id');
        $products = Product::whereIn('id', $productIds)->get()->keyBy('id');

        $total = 0;
        $items = [];

        foreach ($cart as $cartItem) {
            $product = $products[$cartItem['id']];
            $quantity = $cartItem['quantity'];
            $subtotal = $product->price * $quantity;
            $total += $subtotal;

            $items[] = [
                'product_id' => $product->id,
                'quantity' => $quantity,
                'price' => $product->price,
                'subtotal' => $subtotal,
            ];
        }

        // Create order
        $order = Order::create([
            'total_amount' => $total,
            'status' => 'waiting',
        ]);

        // Save items
        foreach ($items as $item) {
            OrderItem::create(array_merge($item, [
                'order_id' => $order->id,
            ]));
        }

        // Generate queue number (daily reset)
        $todayCount = Queue::whereDate('queue_date', today())->count();
        $queueNumber = 'A' . str_pad($todayCount + 1, 3, '0', STR_PAD_LEFT);

        // Generate unique token for guest tracking
        $token = Str::random(32);

        $queue = Queue::create([
            'order_id' => $order->id,
            'queue_number' => $queueNumber,
            'token' => $token,
            'status' => 'waiting',
            'queue_date' => today(),
        ]);

        // Log queue creation
        QueueLog::create([
            'queue_id' => $queue->id,
            'old_status' => null,
            'new_status' => 'waiting',
            'changed_by' => null,
        ]);

        return response()->json([
            'token' => $token,
            'queue_number' => $queueNumber,
        ]);
    }
}