<?php

use App\Models\Invitation;

test('a first visit increments the counter', function () {
    $invitation = Invitation::factory()->published()->create(['visitor_count' => 0]);

    $this->postJson(route('invitation.visit', $invitation->slug), ['session_id' => 'sess-a'])
        ->assertOk()
        ->assertJson(['success' => true, 'data' => ['count' => 1]]);

    expect($invitation->fresh()->visitor_count)->toBe(1);
});

test('a repeat visit from the same ip and session does not increment', function () {
    $invitation = Invitation::factory()->published()->create(['visitor_count' => 0]);

    $this->postJson(route('invitation.visit', $invitation->slug), ['session_id' => 'sess-a']);
    $this->postJson(route('invitation.visit', $invitation->slug), ['session_id' => 'sess-a'])
        ->assertJson(['data' => ['count' => 1]]);

    expect($invitation->fresh()->visitor_count)->toBe(1);
    expect($invitation->visitors()->count())->toBe(1);
});

test('a different session counts as a new visitor', function () {
    $invitation = Invitation::factory()->published()->create(['visitor_count' => 0]);

    $this->postJson(route('invitation.visit', $invitation->slug), ['session_id' => 'sess-a']);
    $this->postJson(route('invitation.visit', $invitation->slug), ['session_id' => 'sess-b'])
        ->assertJson(['data' => ['count' => 2]]);

    expect($invitation->fresh()->visitor_count)->toBe(2);
});

test('the count endpoint returns the current count', function () {
    $invitation = Invitation::factory()->published()->create(['visitor_count' => 42]);

    $this->getJson(route('invitation.visitors', $invitation->slug))
        ->assertOk()
        ->assertJson(['success' => true, 'data' => ['count' => 42]]);
});

test('visitor endpoints 404 for a draft invitation', function () {
    $invitation = Invitation::factory()->draft()->create();

    $this->postJson(route('invitation.visit', $invitation->slug), ['session_id' => 'x'])->assertNotFound();
    $this->getJson(route('invitation.visitors', $invitation->slug))->assertNotFound();
});
