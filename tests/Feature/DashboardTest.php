<?php

use App\Models\Invitation;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));

    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk();
});

test('dashboard includes the users latest invitation with rsvp count', function () {
    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->create();
    Invitation::factory()->count(3)->create(); // other users

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('dashboard')
        ->where('invitation.id', $invitation->id)
        ->where('invitation.rsvps_count', 0),
    );
});
