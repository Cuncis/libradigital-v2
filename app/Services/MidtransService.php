<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\User;
use Midtrans\Config;
use Midtrans\Snap;

class MidtransService
{
    public function __construct()
    {
        Config::$serverKey = (string) config('services.midtrans.server_key');
        Config::$isProduction = (bool) config('services.midtrans.is_production');
        Config::$isSanitized = true;
        Config::$is3ds = true;
    }

    /**
     * Request a Snap token for a pending payment.
     */
    public function createSnapToken(Payment $payment, User $user): string
    {
        return Snap::getSnapToken([
            'transaction_details' => [
                'order_id' => $payment->order_id,
                'gross_amount' => $payment->gross_amount,
            ],
            'customer_details' => [
                'first_name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    /**
     * Verify the SHA512 signature Midtrans sends with webhook notifications.
     *
     * @param  array{order_id?: string, status_code?: string, gross_amount?: string, signature_key?: string}  $payload
     */
    public function verifySignature(array $payload): bool
    {
        $expected = hash('sha512',
            ($payload['order_id'] ?? '').
            ($payload['status_code'] ?? '').
            ($payload['gross_amount'] ?? '').
            (string) config('services.midtrans.server_key'),
        );

        return hash_equals($expected, $payload['signature_key'] ?? '');
    }
}
