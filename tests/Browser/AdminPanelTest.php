<?php

use App\Enums\OrderStatus;
use App\Models\Invitation;
use App\Models\Order;
use App\Models\User;

test('every admin panel page renders without javascript errors', function () {
    $admin = User::factory()->admin()->create();
    Invitation::factory()->active()->create();
    Order::factory()->create(['status' => OrderStatus::Paid]);

    $this->actingAs($admin);

    visit(route('admin.dashboard'))
        ->assertSee('Total Pengguna')
        ->assertSee('Total Pendapatan')
        ->assertNoJavaScriptErrors();

    visit(route('admin.users.index'))
        ->assertSee('Peran')
        ->assertNoJavaScriptErrors();

    visit(route('admin.invitations.index'))
        ->assertSee('Mempelai')
        ->assertNoJavaScriptErrors();

    visit(route('admin.orders.index'))
        ->assertSee('Dibayar')
        ->assertNoJavaScriptErrors();
});

test('an admin can grant admin access from the users table', function () {
    $admin = User::factory()->admin()->create();
    $target = User::factory()->create([
        'is_admin' => false,
        'name' => 'Calon Admin',
    ]);

    $this->actingAs($admin);

    visit(route('admin.users.index'))
        ->assertSee('Calon Admin')
        ->assertNoJavaScriptErrors()
        ->click('Jadikan Admin')
        ->assertSee('Jadikan admin?')
        ->click('Ya, jadikan admin')
        ->assertNoJavaScriptErrors();

    expect($target->refresh()->is_admin)->toBeTrue();
});

test('an admin can refund a paid order from the orders table', function () {
    $admin = User::factory()->admin()->create();
    $order = Order::factory()->create(['status' => OrderStatus::Paid]);

    $this->actingAs($admin);

    visit(route('admin.orders.index'))
        ->assertSee('Refund')
        ->assertNoJavaScriptErrors()
        ->click('Refund')
        ->assertSee('Tandai sebagai refund?')
        ->click('Tandai Refund')
        ->assertNoJavaScriptErrors();

    expect($order->refresh()->status)->toBe(OrderStatus::Refunded);
});
