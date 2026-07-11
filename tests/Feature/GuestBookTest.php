<?php

use App\Enums\Addon;
use App\Models\GuestBookEntry;
use App\Models\Invitation;
use Inertia\Testing\AssertableInertia as Assert;

test('a visitor can sign the guest book when the add-on is active', function () {
    $invitation = Invitation::factory()->active()->withAddons([Addon::GuestBook->value])->create();

    $this->postJson(route('invitation.guestbook.store', $invitation->slug), [
        'name' => 'Rahmat',
        'message' => 'Selamat menempuh hidup baru!',
    ])->assertCreated();

    $entry = GuestBookEntry::query()->where('invitation_id', $invitation->id)->sole();
    expect($entry->name)->toBe('Rahmat');
    expect($entry->message)->toBe('Selamat menempuh hidup baru!');
});

test('the guest book is unavailable without the add-on', function () {
    $invitation = Invitation::factory()->active()->create();

    $this->postJson(route('invitation.guestbook.store', $invitation->slug), [
        'name' => 'Rahmat',
        'message' => 'Selamat!',
    ])->assertNotFound();

    expect(GuestBookEntry::query()->count())->toBe(0);
});

test('the guest book is unavailable on a non-public invitation', function () {
    $invitation = Invitation::factory()->draft()->withAddons([Addon::GuestBook->value])->create();

    $this->postJson(route('invitation.guestbook.store', $invitation->slug), [
        'name' => 'Rahmat',
        'message' => 'Selamat!',
    ])->assertNotFound();
});

test('the guest book requires a name and message', function () {
    $invitation = Invitation::factory()->active()->withAddons([Addon::GuestBook->value])->create();

    $this->postJson(route('invitation.guestbook.store', $invitation->slug), [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['name', 'message']);
});

test('the public page exposes guest book entries when the add-on is active', function () {
    $invitation = Invitation::factory()->active()->withAddons([Addon::GuestBook->value])->create();
    GuestBookEntry::factory()->for($invitation)->create(['name' => 'Dewi']);

    $this->get(route('invitation.show', $invitation->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('invitation.has_guest_book', true)
            ->has('invitation.guest_book_entries', 1)
            ->where('invitation.guest_book_entries.0.name', 'Dewi'),
        );
});

test('the public page hides the guest book without the add-on', function () {
    $invitation = Invitation::factory()->active()->create();

    $this->get(route('invitation.show', $invitation->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('invitation.has_guest_book', false)
            ->missing('invitation.guest_book_entries'),
        );
});
