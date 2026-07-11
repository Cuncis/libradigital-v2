<?php

use App\Enums\Addon;
use App\Enums\InvitationStatus;
use App\Enums\OrderStatus;
use App\Enums\Package;
use App\Models\Invitation;
use App\Models\Order;
use App\Models\Template;
use App\Models\User;
use App\Services\MidtransService;

function midtransSignature(string $orderNumber, string $statusCode, string $grossAmount): string
{
    return hash('sha512', $orderNumber.$statusCode.$grossAmount.'test-server-key');
}

test('guests cannot create an order', function () {
    $invitation = Invitation::factory()->create();

    $this->post(route('invitations.orders.store', $invitation))->assertRedirect(route('login'));
});

test('the owner can create an order which moves the invitation to pending payment', function () {
    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->draft()->create();

    $this->mock(MidtransService::class, function ($mock) {
        $mock->shouldReceive('createSnapToken')->once()->andReturn('fake-snap-token');
    });

    $response = $this->actingAs($user)->postJson(route('invitations.orders.store', $invitation), [
        'package' => 'premium',
    ]);

    $response->assertCreated();
    $response->assertJsonPath('data.snap_token', 'fake-snap-token');

    $order = Order::query()->where('invitation_id', $invitation->id)->sole();
    expect($order->status)->toBe(OrderStatus::Pending);
    expect($order->package)->toBe(Package::Premium);
    expect($order->total_amount)->toBe(Package::Premium->price());
    expect($order->snap_token)->toBe('fake-snap-token');

    $invitation->refresh();
    expect($invitation->status)->toBe(InvitationStatus::PendingPayment);
    expect($invitation->package)->toBe(Package::Premium);
});

test('an order can include add-ons which are recorded and summed into the total sent to midtrans', function () {
    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->draft()->create();

    $expectedTotal = Package::Standard->price()
        + Addon::ExtraGallery->price()
        + Addon::GuestBook->price();

    $this->mock(MidtransService::class, function ($mock) use ($expectedTotal) {
        $mock->shouldReceive('createSnapToken')
            ->once()
            ->withArgs(fn (Order $order) => $order->total_amount === $expectedTotal)
            ->andReturn('fake-snap-token');
    });

    $this->actingAs($user)->postJson(route('invitations.orders.store', $invitation), [
        'package' => 'standard',
        'addons' => ['extra_gallery', 'guest_book'],
    ])->assertCreated();

    $order = Order::query()->where('invitation_id', $invitation->id)->sole();
    expect($order->addon_amount)->toBe(Addon::ExtraGallery->price() + Addon::GuestBook->price());
    expect($order->total_amount)->toBe($expectedTotal);
    expect($order->orderAddons()->count())->toBe(2);
});

test('duplicate add-ons are only charged once', function () {
    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->draft()->create();

    $this->mock(MidtransService::class, function ($mock) {
        $mock->shouldReceive('createSnapToken')->once()->andReturn('fake-snap-token');
    });

    $this->actingAs($user)->postJson(route('invitations.orders.store', $invitation), [
        'package' => 'standard',
        'addons' => ['extra_gallery', 'extra_gallery'],
    ])->assertCreated();

    $order = Order::query()->where('invitation_id', $invitation->id)->sole();
    expect($order->orderAddons()->count())->toBe(1);
    expect($order->addon_amount)->toBe(Addon::ExtraGallery->price());
});

test('an invalid add-on is rejected', function () {
    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->draft()->create();

    $this->actingAs($user)->postJson(route('invitations.orders.store', $invitation), [
        'package' => 'standard',
        'addons' => ['bogus_addon'],
    ])->assertStatus(422)->assertJsonValidationErrors('addons.0');
});

test('an order without add-ons has a zero add-on amount', function () {
    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->draft()->create();

    $this->mock(MidtransService::class, function ($mock) {
        $mock->shouldReceive('createSnapToken')->once()->andReturn('fake-snap-token');
    });

    $this->actingAs($user)->postJson(route('invitations.orders.store', $invitation), [
        'package' => 'premium',
    ])->assertCreated();

    $order = Order::query()->where('invitation_id', $invitation->id)->sole();
    expect($order->addon_amount)->toBe(0);
    expect($order->total_amount)->toBe(Package::Premium->price());
    expect($order->orderAddons()->count())->toBe(0);
});

test('a non-owner cannot create an order for an invitation', function () {
    $invitation = Invitation::factory()->create();
    $intruder = User::factory()->create();

    $this->mock(MidtransService::class, function ($mock) {
        $mock->shouldNotReceive('createSnapToken');
    });

    $this->actingAs($intruder)->postJson(route('invitations.orders.store', $invitation), [
        'package' => 'standard',
    ])->assertForbidden();
});

test('the package is required and must be valid', function () {
    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->draft()->create();

    $this->actingAs($user)->postJson(route('invitations.orders.store', $invitation), [
        'package' => 'platinum',
    ])->assertStatus(422)->assertJsonValidationErrors('package');
});

test('an order is rejected when the package tier is below the template requirement', function () {
    $user = User::factory()->create();
    $template = Template::factory()->requires(Package::Premium)->create();
    $invitation = Invitation::factory()->for($user)->draft()->create([
        'template_id' => $template->id,
    ]);

    $this->mock(MidtransService::class, function ($mock) {
        $mock->shouldNotReceive('createSnapToken');
    });

    $this->actingAs($user)->postJson(route('invitations.orders.store', $invitation), [
        'package' => 'standard',
    ])->assertStatus(422)->assertJsonValidationErrors('package');

    expect(Order::query()->where('invitation_id', $invitation->id)->count())->toBe(0);
});

test('an order succeeds when the package tier meets the template requirement', function () {
    $user = User::factory()->create();
    $template = Template::factory()->requires(Package::Premium)->create();
    $invitation = Invitation::factory()->for($user)->draft()->create([
        'template_id' => $template->id,
    ]);

    $this->mock(MidtransService::class, function ($mock) {
        $mock->shouldReceive('createSnapToken')->once()->andReturn('fake-snap-token');
    });

    $this->actingAs($user)->postJson(route('invitations.orders.store', $invitation), [
        'package' => 'signature',
    ])->assertCreated();

    expect(Order::query()->where('invitation_id', $invitation->id)->sole()->package)
        ->toBe(Package::Signature);
});

test('creating an order for an already active invitation is a no-op', function () {
    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->active()->create();

    $this->mock(MidtransService::class, function ($mock) {
        $mock->shouldNotReceive('createSnapToken');
    });

    $this->actingAs($user)->postJson(route('invitations.orders.store', $invitation), [
        'package' => 'standard',
    ])->assertOk();

    expect(Order::query()->where('invitation_id', $invitation->id)->count())->toBe(0);
});

test('a settlement webhook with a valid signature activates the invitation', function () {
    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->pendingPayment()->create();
    $order = Order::factory()->for($user)->for($invitation)->create([
        'package' => Package::Standard,
        'total_amount' => Package::Standard->price(),
    ]);

    $payload = [
        'order_id' => $order->order_number,
        'status_code' => '200',
        'gross_amount' => Package::Standard->price().'.00',
        'transaction_status' => 'settlement',
        'transaction_id' => 'trx-123',
    ];
    $payload['signature_key'] = midtransSignature($payload['order_id'], $payload['status_code'], $payload['gross_amount']);

    $this->postJson(route('billing.webhook'), $payload)->assertOk();

    $order->refresh();
    expect($order->status)->toBe(OrderStatus::Paid);
    expect($order->paid_at)->not->toBeNull();
    expect($order->midtrans_transaction_id)->toBe('trx-123');

    $invitation->refresh();
    expect($invitation->status)->toBe(InvitationStatus::Active);
    expect($invitation->active_until?->toDateString())
        ->toBe(now()->addMonths(Package::Standard->durationMonths())->toDateString());
});

test('a paid webhook copies the purchased add-ons onto the invitation', function () {
    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->pendingPayment()->create();
    $order = Order::factory()->for($user)->for($invitation)->create([
        'package' => Package::Standard,
        'total_amount' => Package::Standard->price(),
    ]);
    $order->orderAddons()->create(['addon' => Addon::GuestBook, 'price' => Addon::GuestBook->price()]);

    $payload = [
        'order_id' => $order->order_number,
        'status_code' => '200',
        'gross_amount' => Package::Standard->price().'.00',
        'transaction_status' => 'settlement',
    ];
    $payload['signature_key'] = midtransSignature($payload['order_id'], $payload['status_code'], $payload['gross_amount']);

    $this->postJson(route('billing.webhook'), $payload)->assertOk();

    expect($invitation->refresh()->hasAddon(Addon::GuestBook))->toBeTrue();
});

test('a signature webhook is rejected when the signature is invalid', function () {
    $order = Order::factory()->create();

    $payload = [
        'order_id' => $order->order_number,
        'status_code' => '200',
        'gross_amount' => '179000.00',
        'transaction_status' => 'settlement',
        'signature_key' => 'not-the-right-signature',
    ];

    $this->postJson(route('billing.webhook'), $payload)->assertForbidden();

    expect($order->fresh()->status)->toBe(OrderStatus::Pending);
});

test('a pending webhook leaves the order and invitation unchanged', function () {
    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->pendingPayment()->create();
    $order = Order::factory()->for($user)->for($invitation)->create();

    $payload = [
        'order_id' => $order->order_number,
        'status_code' => '201',
        'gross_amount' => $order->total_amount.'.00',
        'transaction_status' => 'pending',
    ];
    $payload['signature_key'] = midtransSignature($payload['order_id'], $payload['status_code'], $payload['gross_amount']);

    $this->postJson(route('billing.webhook'), $payload)->assertOk();

    expect($order->fresh()->status)->toBe(OrderStatus::Pending);
    expect($invitation->fresh()->status)->toBe(InvitationStatus::PendingPayment);
});

test('an expire webhook fails the order and returns the invitation to draft', function () {
    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->pendingPayment()->create();
    $order = Order::factory()->for($user)->for($invitation)->create();

    $payload = [
        'order_id' => $order->order_number,
        'status_code' => '202',
        'gross_amount' => $order->total_amount.'.00',
        'transaction_status' => 'expire',
    ];
    $payload['signature_key'] = midtransSignature($payload['order_id'], $payload['status_code'], $payload['gross_amount']);

    $this->postJson(route('billing.webhook'), $payload)->assertOk();

    expect($order->fresh()->status)->toBe(OrderStatus::Failed);
    expect($invitation->fresh()->status)->toBe(InvitationStatus::Draft);
});
