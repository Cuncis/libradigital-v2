<?php

namespace App\Http\Controllers;

use App\Concerns\RespondsWithJson;
use App\Enums\InvitationStatus;
use App\Enums\OrderStatus;
use App\Enums\Package;
use App\Http\Requests\StoreOrderRequest;
use App\Models\Invitation;
use App\Models\Order;
use App\Notifications\InvitationActivated;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    use RespondsWithJson;

    public function __construct(private MidtransService $midtrans) {}

    /**
     * Create a pending order for an invitation and return a Snap token.
     */
    public function store(StoreOrderRequest $request, Invitation $invitation): JsonResponse
    {
        $this->authorize('update', $invitation);

        if ($invitation->isActive()) {
            return $this->success(null, 'Undangan ini sudah aktif.');
        }

        $package = $request->enum('package', Package::class);
        $user = $request->user();

        $order = $invitation->orders()->create([
            'user_id' => $user->id,
            'order_number' => 'INV-'.now()->format('Ymd').'-'.Str::upper(Str::random(6)),
            'status' => OrderStatus::Pending,
            'package' => $package,
            'base_amount' => $package->price(),
            'addon_amount' => 0,
            'total_amount' => $package->price(),
        ]);

        $invitation->update([
            'package' => $package,
            'status' => InvitationStatus::PendingPayment,
        ]);

        $snapToken = $this->midtrans->createSnapToken($order, $user);

        $order->update(['snap_token' => $snapToken]);

        return $this->success(['snap_token' => $snapToken], 'Token pembayaran berhasil dibuat.', 201);
    }

    /**
     * Handle the Midtrans transaction notification webhook (public, signature-verified).
     */
    public function webhook(Request $request): JsonResponse
    {
        $payload = $request->all();

        abort_unless($this->midtrans->verifySignature($payload), 403);

        $order = Order::query()->where('order_number', $payload['order_id'] ?? null)->firstOrFail();

        $status = $this->resolveStatus(
            $payload['transaction_status'] ?? '',
            $payload['fraud_status'] ?? null,
            $order->status,
        );

        $justActivated = $status === OrderStatus::Paid && $order->status !== OrderStatus::Paid;

        DB::transaction(function () use ($order, $status, $payload) {
            $order->update([
                'status' => $status,
                'paid_at' => $status === OrderStatus::Paid ? now() : $order->paid_at,
                'midtrans_transaction_id' => $payload['transaction_id'] ?? $order->midtrans_transaction_id,
            ]);

            if ($status === OrderStatus::Paid) {
                $order->invitation->update([
                    'status' => InvitationStatus::Active,
                    'active_until' => $order->package->activeUntil(now())?->toDateString(),
                ]);
            } elseif ($status === OrderStatus::Failed) {
                $order->invitation->update(['status' => InvitationStatus::Draft]);
            }
        });

        // Notify the couple only on the first transition to paid so duplicate
        // Midtrans callbacks don't send repeat emails.
        if ($justActivated) {
            $order->invitation->user->notify(new InvitationActivated($order->invitation));
        }

        return $this->success();
    }

    private function resolveStatus(string $transactionStatus, ?string $fraudStatus, OrderStatus $current): OrderStatus
    {
        return match (true) {
            $transactionStatus === 'capture' && $fraudStatus === 'accept' => OrderStatus::Paid,
            $transactionStatus === 'settlement' => OrderStatus::Paid,
            $transactionStatus === 'pending' => OrderStatus::Pending,
            in_array($transactionStatus, ['deny', 'cancel', 'expire'], true) => OrderStatus::Failed,
            default => $current,
        };
    }
}
