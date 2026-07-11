<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $status = $request->enum('status', OrderStatus::class);

        $orders = Order::query()
            ->with('user:id,name,email')
            ->when($search !== '', function ($query) use ($search): void {
                $query->where('order_number', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($query) use ($search): void {
                        $query->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            })
            ->when($status, fn ($query) => $query->where('status', $status))
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Order $order): array => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'user_name' => $order->user->name,
                'user_email' => $order->user->email,
                'package' => $order->package->label(),
                'addon_amount' => $order->addon_amount,
                'total_amount' => $order->total_amount,
                'status' => $order->status->value,
                'paid_at' => $order->paid_at?->toIso8601String(),
                'created_at' => $order->created_at?->toIso8601String(),
            ]);

        return Inertia::render('admin/orders', [
            'orders' => $orders,
            'filters' => [
                'search' => $search,
                'status' => $status?->value,
            ],
        ]);
    }

    /**
     * Mark a paid order as refunded. Invitation access is left untouched — expire
     * it separately from the invitations screen if the refund should revoke it.
     */
    public function refund(Order $order): RedirectResponse
    {
        abort_unless(
            $order->status === OrderStatus::Paid,
            403,
            'Hanya pesanan lunas yang dapat direfund.',
        );

        $order->update(['status' => OrderStatus::Refunded]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Pesanan {$order->order_number} ditandai sebagai refund.",
        ]);

        return back();
    }
}
