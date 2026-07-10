<?php

use App\Models\Invitation;
use App\Models\Rsvp;

test('a visitor can view a published invitation and submit an rsvp', function () {
    $invitation = Invitation::factory()->published()->create([
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
    $invitation = Invitation::factory()->published()->create();

    $page = visit(route('invitation.show', $invitation->slug).'?tamu=Rahmat');

    $page->assertSee('Rahmat')
        ->assertNoJavaScriptErrors();
});

test('a draft invitation is not publicly viewable', function () {
    $invitation = Invitation::factory()->draft()->create();

    $page = visit(route('invitation.show', $invitation->slug));

    $page->assertStatus(404);
});
