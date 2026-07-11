<?php

use App\Enums\Package;
use App\Models\Invitation;
use App\Models\Order;
use App\Models\User;
use App\Notifications\InvitationActivated;
use App\Notifications\RsvpReceived;
use Illuminate\Support\Facades\Notification;

function settlementPayload(Order $order): array
{
    $payload = [
        'order_id' => $order->order_number,
        'status_code' => '200',
        'gross_amount' => $order->total_amount.'.00',
        'transaction_status' => 'settlement',
        'transaction_id' => 'trx-123',
    ];
    $payload['signature_key'] = hash(
        'sha512',
        $payload['order_id'].$payload['status_code'].$payload['gross_amount'].'test-server-key',
    );

    return $payload;
}

test('the owner is notified when their invitation is activated by a paid webhook', function () {
    Notification::fake();

    $owner = User::factory()->create();
    $invitation = Invitation::factory()->for($owner)->pendingPayment()->create();
    $order = Order::factory()->for($owner)->for($invitation)->create([
        'package' => Package::Standard,
        'total_amount' => Package::Standard->price(),
    ]);

    $this->postJson(route('billing.webhook'), settlementPayload($order))->assertOk();

    Notification::assertSentTo(
        $owner,
        InvitationActivated::class,
        fn (InvitationActivated $n) => $n->invitation->is($invitation),
    );
});

test('a duplicate paid webhook does not resend the activation email', function () {
    Notification::fake();

    $owner = User::factory()->create();
    $invitation = Invitation::factory()->for($owner)->pendingPayment()->create();
    $order = Order::factory()->for($owner)->for($invitation)->create([
        'package' => Package::Standard,
        'total_amount' => Package::Standard->price(),
    ]);

    $payload = settlementPayload($order);
    $this->postJson(route('billing.webhook'), $payload)->assertOk();
    $this->postJson(route('billing.webhook'), $payload)->assertOk();

    Notification::assertSentToTimes($owner, InvitationActivated::class, 1);
});

test('a failed webhook does not notify the owner', function () {
    Notification::fake();

    $owner = User::factory()->create();
    $invitation = Invitation::factory()->for($owner)->pendingPayment()->create();
    $order = Order::factory()->for($owner)->for($invitation)->create([
        'package' => Package::Standard,
        'total_amount' => Package::Standard->price(),
    ]);

    $payload = [
        'order_id' => $order->order_number,
        'status_code' => '202',
        'gross_amount' => $order->total_amount.'.00',
        'transaction_status' => 'expire',
    ];
    $payload['signature_key'] = hash(
        'sha512',
        $payload['order_id'].$payload['status_code'].$payload['gross_amount'].'test-server-key',
    );

    $this->postJson(route('billing.webhook'), $payload)->assertOk();

    Notification::assertNothingSent();
});

test('the activation mail renders with the couple, package and link', function () {
    $invitation = Invitation::factory()->active()->create([
        'groom_name' => 'Budi',
        'bride_name' => 'Siti',
        'package' => Package::Standard,
    ]);

    $mail = (new InvitationActivated($invitation))->toMail($invitation->user);

    expect($mail->subject)->toContain('aktif');
    expect($mail->actionUrl)->toBe(route('invitation.show', $invitation->slug));
    expect(implode(' ', $mail->introLines))->toContain('Standard');
});

test('the rsvp mail renders with the guest name and dashboard link', function () {
    $invitation = Invitation::factory()->active()->create();
    $rsvp = $invitation->rsvps()->create([
        'guest_name' => 'Ahmad',
        'attendance' => 'hadir',
        'message' => 'Selamat!',
    ]);

    $mail = (new RsvpReceived($rsvp))->toMail($invitation->user);

    expect($mail->subject)->toContain('Ahmad');
    expect($mail->actionUrl)->toBe(route('invitations.rsvps.index', $invitation->id));
    expect(implode(' ', $mail->introLines))->toContain('Ahmad');
});

test('the owner is notified when a guest submits an rsvp', function () {
    Notification::fake();

    $owner = User::factory()->create();
    $invitation = Invitation::factory()->for($owner)->active()->create();

    $this->postJson(route('invitation.rsvp.store', $invitation->slug), [
        'guest_name' => 'Ahmad',
        'attendance' => 'hadir',
        'message' => 'Selamat!',
    ])->assertCreated();

    Notification::assertSentTo(
        $owner,
        RsvpReceived::class,
        fn (RsvpReceived $n) => $n->rsvp->guest_name === 'Ahmad',
    );
});
