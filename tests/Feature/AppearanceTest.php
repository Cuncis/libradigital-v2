<?php

use App\Models\User;

beforeEach(fn () => $this->withoutVite());

test('the app defaults to light mode when no appearance cookie is set', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk();
    $response->assertSee('<html lang="en" class="">', false);
});

test('the dark appearance cookie renders the dark html class', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->withUnencryptedCookies(['appearance' => 'dark'])
        ->get(route('dashboard'));

    $response->assertOk();
    $response->assertSee('<html lang="en" class="dark">', false);
});
