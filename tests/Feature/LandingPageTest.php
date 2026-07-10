<?php

use App\Enums\Package;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('the landing page renders with the full package catalog', function () {
    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->has('packages', count(Package::cases()))
            ->where('packages.0.value', Package::Starter->value)
            ->where('packages.0.price', Package::Starter->price())
            ->has('packages.0.features'),
        );
});

test('the landing page is reachable by guests', function () {
    $this->get(route('home'))->assertOk();
});

test('the landing page renders for authenticated users', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('home'))
        ->assertOk();
});
