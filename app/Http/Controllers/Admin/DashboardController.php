<?php

namespace App\Http\Controllers\Admin;

use App\Enums\InvitationStatus;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Invitation;
use App\Models\Order;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $invitationsByStatus = Invitation::query()
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $recentOrders = Order::query()
            ->with('user:id,name,email')
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (Order $order): array => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'user_name' => $order->user->name,
                'package' => $order->package->label(),
                'total_amount' => $order->total_amount,
                'status' => $order->status->value,
                'created_at' => $order->created_at?->toIso8601String(),
            ]);

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'users' => User::count(),
                'invitations' => Invitation::count(),
                'active_invitations' => Invitation::where('status', InvitationStatus::Active)->count(),
                'paid_orders' => Order::where('status', OrderStatus::Paid)->count(),
                'revenue' => (int) Order::where('status', OrderStatus::Paid)->sum('total_amount'),
            ],
            'invitationsByStatus' => [
                'draft' => (int) ($invitationsByStatus[InvitationStatus::Draft->value] ?? 0),
                'pending_payment' => (int) ($invitationsByStatus[InvitationStatus::PendingPayment->value] ?? 0),
                'active' => (int) ($invitationsByStatus[InvitationStatus::Active->value] ?? 0),
                'expired' => (int) ($invitationsByStatus[InvitationStatus::Expired->value] ?? 0),
            ],
            'recentOrders' => $recentOrders,
        ]);
    }
}
