<?php

use App\Models\Invitation;
use App\Models\User;

test('the owner can edit couple details and the change autosaves on step change', function () {
    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->draft()->create();

    $this->actingAs($user);

    $page = visit(route('invitations.edit', $invitation));

    $page->assertSee('Mempelai')
        ->assertNoJavaScriptErrors()
        ->fill('groom_name', 'Andi')
        ->fill('bride_name', 'Wulan')
        ->click('Lanjut')
        ->assertSee('Lokasi');

    expect($invitation->fresh()->groom_name)->toBe('Andi');
    expect($invitation->fresh()->bride_name)->toBe('Wulan');
});

test('the owner can walk through the builder steps to the package checkout', function () {
    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->draft()->create();

    $this->actingAs($user);

    $page = visit(route('invitations.edit', $invitation));

    $page->assertNoJavaScriptErrors()
        ->click('Lanjut') // Mempelai -> Lokasi
        ->click('Lanjut') // Lokasi -> Foto
        ->click('Lanjut') // Foto -> Kisah
        ->click('Lanjut') // Kisah -> Angpao
        ->click('Lanjut') // Angpao -> Template
        ->click('Lanjut') // Template -> Review
        ->assertSee('Pilih paket')
        ->assertSee('Standard')
        ->assertSee('Signature')
        ->assertSee('Bayar & Publikasikan');
});

test('a non-owner cannot open the builder', function () {
    $invitation = Invitation::factory()->create();
    $intruder = User::factory()->create();

    $this->actingAs($intruder);

    $page = visit(route('invitations.edit', $invitation));

    $page->assertStatus(403);
});
