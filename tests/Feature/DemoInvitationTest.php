<?php

use App\Enums\InvitationStatus;
use App\Models\BlogPost;
use App\Models\Invitation;
use Inertia\Testing\AssertableInertia as Assert;

test('the demo factory state produces an active, flagged invitation', function () {
    $demo = Invitation::factory()->demo()->create();

    expect($demo->is_demo)->toBeTrue()
        ->and($demo->status)->toBe(InvitationStatus::Active)
        ->and($demo->isPubliclyVisible())->toBeTrue();
});

test('the landing page exposes demo invitations and latest posts', function () {
    Invitation::factory()->demo()->count(3)->create();
    BlogPost::factory()->published()->count(2)->create();

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->has('demos', 3)
            ->has('demos.0.url')
            ->has('demos.0.template_name')
            ->has('posts', 2),
        );
});

test('the landing page only surfaces active demos', function () {
    Invitation::factory()->demo()->create();
    Invitation::factory()->create(['is_demo' => true, 'status' => InvitationStatus::Draft]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('demos', 1));
});

test('a demo invitation is reachable on its public page', function () {
    $demo = Invitation::factory()->demo()->create();

    $this->get(route('invitation.show', $demo->slug))->assertOk();
});

test('the landing page caps demos at six per package tier', function () {
    Invitation::factory()->demo()->count(8)->create(['package' => \App\Enums\Package::Starter]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('demos', 6)
            ->where('demos.0.package', \App\Enums\Package::Starter->value),
        );
});
