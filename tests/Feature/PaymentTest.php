<?php

use App\Enums\PaymentStatus;
use App\Enums\Plan;
use App\Models\Payment;
use App\Models\User;
use App\Services\MidtransService;

function midtransSignature(string $orderId, string $statusCode, string $grossAmount): string
{
    return hash('sha512', $orderId.$statusCode.$grossAmount.'test-server-key');
}

test('guests cannot request an upgrade', function () {
    $this->post(route('billing.upgrade'))->assertRedirect(route('login'));
});

test('a free user receives a snap token and a pending payment is recorded', function () {
    $user = User::factory()->create(['plan' => Plan::Free]);

    $this->mock(MidtransService::class, function ($mock) {
        $mock->shouldReceive('createSnapToken')->once()->andReturn('fake-snap-token');
    });

    $response = $this->actingAs($user)->postJson(route('billing.upgrade'));

    $response->assertCreated();
    $response->assertJsonPath('data.snap_token', 'fake-snap-token');

    $payment = Payment::query()->where('user_id', $user->id)->sole();
    expect($payment->status)->toBe(PaymentStatus::Pending);
    expect($payment->snap_token)->toBe('fake-snap-token');
    expect($payment->gross_amount)->toBe(150_000);
});

test('a premium user cannot start another upgrade payment', function () {
    $user = User::factory()->create(['plan' => Plan::Premium]);

    $this->mock(MidtransService::class, function ($mock) {
        $mock->shouldNotReceive('createSnapToken');
    });

    $this->actingAs($user)->postJson(route('billing.upgrade'))->assertOk();

    expect(Payment::query()->where('user_id', $user->id)->count())->toBe(0);
});

test('a settlement webhook with a valid signature marks the payment paid and upgrades the user', function () {
    $user = User::factory()->create(['plan' => Plan::Free]);
    $payment = Payment::factory()->for($user)->create(['gross_amount' => 150_000]);

    $payload = [
        'order_id' => $payment->order_id,
        'status_code' => '200',
        'gross_amount' => '150000.00',
        'transaction_status' => 'settlement',
    ];
    $payload['signature_key'] = midtransSignature($payload['order_id'], $payload['status_code'], $payload['gross_amount']);

    $this->postJson(route('billing.webhook'), $payload)->assertOk();

    expect($payment->fresh()->status)->toBe(PaymentStatus::Paid);
    expect($payment->fresh()->paid_at)->not->toBeNull();
    expect($user->fresh()->plan)->toBe(Plan::Premium);
});

test('a webhook with an invalid signature is rejected', function () {
    $payment = Payment::factory()->create();

    $payload = [
        'order_id' => $payment->order_id,
        'status_code' => '200',
        'gross_amount' => '150000.00',
        'transaction_status' => 'settlement',
        'signature_key' => 'not-the-right-signature',
    ];

    $this->postJson(route('billing.webhook'), $payload)->assertForbidden();

    expect($payment->fresh()->status)->toBe(PaymentStatus::Pending);
});

test('a pending transaction status leaves the payment pending and the user on the free plan', function () {
    $user = User::factory()->create(['plan' => Plan::Free]);
    $payment = Payment::factory()->for($user)->create(['gross_amount' => 150_000]);

    $payload = [
        'order_id' => $payment->order_id,
        'status_code' => '201',
        'gross_amount' => '150000.00',
        'transaction_status' => 'pending',
    ];
    $payload['signature_key'] = midtransSignature($payload['order_id'], $payload['status_code'], $payload['gross_amount']);

    $this->postJson(route('billing.webhook'), $payload)->assertOk();

    expect($payment->fresh()->status)->toBe(PaymentStatus::Pending);
    expect($user->fresh()->plan)->toBe(Plan::Free);
});
