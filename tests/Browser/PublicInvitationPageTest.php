<?php

use App\Enums\Addon;
use App\Models\GuestBookEntry;
use App\Models\Invitation;
use App\Models\Rsvp;

test('a visitor can view an active invitation and submit an rsvp', function () {
    $invitation = Invitation::factory()->active()->create([
        'groom_name' => 'Budi',
        'bride_name' => 'Siti',
    ]);

    $page = visit(route('invitation.show', $invitation->slug));

    $page->assertSee('Budi')
        ->assertSee('Siti')
        ->assertSee('Konfirmasi Kehadiran')
        ->assertNoJavaScriptErrors()
        ->fill('guest_name', 'Ahmad')
        ->click('Hadir')
        ->fill('message', 'Selamat menempuh hidup baru!')
        ->click('Kirim')
        ->assertSee('Terima kasih');

    $rsvp = Rsvp::query()->where('invitation_id', $invitation->id)->sole();
    expect($rsvp->guest_name)->toBe('Ahmad');
    expect($rsvp->attendance->value)->toBe('hadir');
    expect($rsvp->message)->toBe('Selamat menempuh hidup baru!');
});

test('a guest name in the tamu query parameter is shown', function () {
    $invitation = Invitation::factory()->active()->create();

    $page = visit(route('invitation.show', $invitation->slug).'?tamu=Rahmat');

    $page->assertSee('Rahmat')
        ->assertNoJavaScriptErrors();
});

test('a visitor can sign the guest book when the add-on is active', function () {
    $invitation = Invitation::factory()->active()->withAddons([Addon::GuestBook->value])->create();
    GuestBookEntry::factory()->for($invitation)->create(['name' => 'Dewi', 'message' => 'Bahagia selalu']);

    $page = visit(route('invitation.show', $invitation->slug));

    $page->assertSee('Buku Tamu')
        ->assertSee('Dewi')
        ->assertNoJavaScriptErrors()
        ->fill('gb_name', 'Rahmat')
        ->fill('gb_message', 'Selamat menempuh hidup baru!')
        ->click('Kirim Ucapan')
        ->assertSee('Rahmat');

    expect(GuestBookEntry::query()->where('name', 'Rahmat')->exists())->toBeTrue();
});

test('the guest book section is hidden without the add-on', function () {
    $invitation = Invitation::factory()->active()->create();

    $page = visit(route('invitation.show', $invitation->slug));

    $page->assertDontSee('Buku Tamu')
        ->assertNoJavaScriptErrors();
});

test('a draft invitation is not publicly viewable', function () {
    $invitation = Invitation::factory()->draft()->create();

    $page = visit(route('invitation.show', $invitation->slug));

    $page->assertSee('404');
});
