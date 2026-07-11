<?php

use App\Enums\InvitationStatus;
use App\Enums\OrderStatus;
use App\Models\Invitation;
use App\Models\Order;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('non-admins cannot reach the admin panel', function (string $routeName) {
    $user = User::factory()->create(['is_admin' => false]);

    $this->actingAs($user)->get(route($routeName))->assertForbidden();
})->with([
    'admin.dashboard',
    'admin.users.index',
    'admin.invitations.index',
    'admin.orders.index',
]);

test('guests are redirected away from the admin panel', function () {
    $this->get(route('admin.dashboard'))->assertRedirect(route('login'));
});

test('the admin dashboard aggregates platform stats', function () {
    $admin = User::factory()->admin()->create();
    $customer = User::factory()->create();
    $invitation = Invitation::factory()->for($customer)->create();
    Order::factory()->for($customer)->for($invitation)->create([
        'status' => OrderStatus::Paid,
        'total_amount' => 179_000,
        'paid_at' => now(),
    ]);

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/dashboard')
            ->where('stats.paid_orders', 1)
            ->where('stats.revenue', 179_000)
            ->where('stats.users', 2)
            ->has('recentOrders', 1)
            ->has('invitationsByStatus'),
        );
});

test('the admin users list paginates and can be searched', function () {
    $admin = User::factory()->admin()->create(['name' => 'Zoraida']);
    User::factory()->create(['name' => 'Findable Person']);

    $this->actingAs($admin)
        ->get(route('admin.users.index', ['search' => 'Findable']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users')
            ->has('users.data', 1)
            ->where('users.data.0.name', 'Findable Person')
            ->where('filters.search', 'Findable'),
        );
});

test('the admin invitations list can be filtered by status', function () {
    $admin = User::factory()->admin()->create();
    Invitation::factory()->create(['status' => InvitationStatus::Active]);
    Invitation::factory()->create(['status' => InvitationStatus::Draft]);

    $this->actingAs($admin)
        ->get(route('admin.invitations.index', ['status' => 'active']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/invitations')
            ->has('invitations.data', 1)
            ->where('invitations.data.0.status', 'active')
            ->where('filters.status', 'active'),
        );
});

test('the admin orders list can be filtered by status', function () {
    $admin = User::factory()->admin()->create();
    Order::factory()->create(['status' => OrderStatus::Paid]);
    Order::factory()->create(['status' => OrderStatus::Pending]);

    $this->actingAs($admin)
        ->get(route('admin.orders.index', ['status' => 'paid']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/orders')
            ->where('orders.data.0.status', 'paid')
            ->where('filters.status', 'paid'),
        );
});
