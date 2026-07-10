<?php

namespace App\Http\Controllers;

use App\Concerns\RespondsWithJson;
use App\Enums\PaymentStatus;
use App\Enums\Plan;
use App\Models\Payment;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    use RespondsWithJson;

    /**
     * Price (in Rupiah) of the one-time Free -> Premium upgrade.
     */
    private const PREMIUM_PRICE = 150_000;

    public function __construct(private MidtransService $midtrans) {}

    /**
     * Create a pending payment and return a Snap token for the Free -> Premium upgrade.
     */
    public function upgrade(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isPremium()) {
            return $this->success(null, 'Anda sudah menggunakan paket Premium.');
        }

        $payment = $user->payments()->create([
            'order_id' => 'PREMIUM-'.$user->id.'-'.Str::upper(Str::random(10)),
            'gross_amount' => self::PREMIUM_PRICE,
            'status' => PaymentStatus::Pending,
        ]);

        $snapToken = $this->midtrans->createSnapToken($payment, $user);

        $payment->update(['snap_token' => $snapToken]);

        return $this->success(['snap_token' => $snapToken], 'Token pembayaran berhasil dibuat.', 201);
    }

    /**
     * Handle the Midtrans transaction notification webhook (public, signature-verified).
     */
    public function webhook(Request $request): JsonResponse
    {
        $payload = $request->all();

        abort_unless($this->midtrans->verifySignature($payload), 403);

        $payment = Payment::query()->where('order_id', $payload['order_id'] ?? null)->firstOrFail();

        $status = $this->resolveStatus(
            $payload['transaction_status'] ?? '',
            $payload['fraud_status'] ?? null,
            $payment->status,
        );

        $payment->update([
            'status' => $status,
            'paid_at' => $status === PaymentStatus::Paid ? now() : $payment->paid_at,
        ]);

        if ($status === PaymentStatus::Paid) {
            $payment->user->update(['plan' => Plan::Premium]);
        }

        return $this->success();
    }

    private function resolveStatus(string $transactionStatus, ?string $fraudStatus, PaymentStatus $current): PaymentStatus
    {
        return match (true) {
            $transactionStatus === 'capture' && $fraudStatus === 'accept' => PaymentStatus::Paid,
            $transactionStatus === 'settlement' => PaymentStatus::Paid,
            $transactionStatus === 'pending' => PaymentStatus::Pending,
            in_array($transactionStatus, ['deny', 'cancel'], true) => PaymentStatus::Failed,
            $transactionStatus === 'expire' => PaymentStatus::Expired,
            default => $current,
        };
    }
}
