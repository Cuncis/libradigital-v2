<?php

use App\Models\User;
use Database\Seeders\AdminSeeder;
use Illuminate\Support\Facades\Route;

beforeEach(function () {
    Route::middleware(['web', 'auth', 'admin'])->get('/__test_admin', fn () => 'ok');
});

test('non-admin users are forbidden from admin routes', function () {
    $user = User::factory()->create(['is_admin' => false]);

    $this->actingAs($user)->get('/__test_admin')->assertForbidden();
});

test('admin users can access admin routes', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->get('/__test_admin')->assertOk();
});

test('the seeded superadmin exists and is flagged', function () {
    $this->seed(AdminSeeder::class);

    $admin = User::where('email', 'admin@libradigital.id')->firstOrFail();
    expect($admin->is_admin)->toBeTrue();
    expect($admin->isPremium())->toBeTrue();
});
