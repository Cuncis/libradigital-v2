<?php

use App\Enums\Addon;
use App\Models\GalleryPhoto;
use App\Models\GiftAccount;
use App\Models\GuestBookEntry;
use App\Models\Invitation;
use App\Models\Rsvp;
use App\Models\Template;

/**
 * Phase 1 parity gate: an invitation whose template carries the "Classic" node
 * tree must render through <TemplateRenderer> with the same content, sections,
 * and interactions as the legacy hardcoded page — and no SSR/JS errors.
 */
function classicInvitation(array $overrides = []): Invitation
{
    $template = Template::factory()->classic()->create();

    $invitation = Invitation::factory()
        ->active()
        ->withAddons([Addon::GuestBook->value])
        ->create([
            'template_id' => $template->id,
            'groom_name' => 'Budi',
            'bride_name' => 'Siti',
            'love_story' => 'Kami bertemu saat kuliah.',
            ...$overrides,
        ]);

    GalleryPhoto::factory()->for($invitation)->create();
    GiftAccount::factory()->for($invitation)->create();
    GuestBookEntry::factory()->for($invitation)->create([
        'name' => 'Dewi',
        'message' => 'Bahagia selalu',
    ]);

    return $invitation;
}

test('the classic layout tree renders every section without JS errors', function () {
    $invitation = classicInvitation();

    $page = visit(route('invitation.show', $invitation->slug));

    $page->assertNoJavaScriptErrors()
        ->assertSee('Budi')
        ->assertSee('Siti')
        ->assertSee('Menuju Hari Bahagia') // countdown
        ->assertSee('Akad Nikah')
        ->assertSee('Resepsi')
        ->assertSee('Kisah Kami') // love story
        ->assertSee('Galeri')
        ->assertSee('Konfirmasi Kehadiran') // rsvp
        ->assertSee('Buku Tamu') // guest book (add-on)
        ->assertSee('Dewi')
        ->assertSee('Angpao Digital') // gift
        ->assertSee('libradigital.id'); // footer
});

test('the classic layout renders a working rsvp form', function () {
    $invitation = classicInvitation();

    $page = visit(route('invitation.show', $invitation->slug));

    $page->assertNoJavaScriptErrors()
        ->fill('guest_name', 'Ahmad')
        ->click('Hadir')
        ->fill('message', 'Selamat menempuh hidup baru!')
        ->click('Kirim')
        ->assertSee('Terima kasih');

    $rsvp = Rsvp::query()->where('invitation_id', $invitation->id)->sole();
    expect($rsvp->guest_name)->toBe('Ahmad');
    expect($rsvp->attendance->value)->toBe('hadir');
});

test('the classic layout shows the tamu guest greeting', function () {
    $invitation = classicInvitation();

    $page = visit(route('invitation.show', $invitation->slug).'?tamu=Rahmat');

    $page->assertSee('Rahmat')
        ->assertNoJavaScriptErrors();
});
