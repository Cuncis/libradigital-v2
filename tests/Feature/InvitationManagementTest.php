<?php

use App\Enums\GiftType;
use App\Enums\InvitationStatus;
use App\Models\GalleryPhoto;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('a user can create an invitation and is sent to the builder', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('invitations.store'), [
        'groom_name' => 'Budi Santoso',
        'bride_name' => 'Siti Rahayu',
    ]);

    $invitation = Invitation::firstOrFail();
    expect($invitation->user_id)->toBe($user->id);
    expect($invitation->slug)->toBe('budi-santoso-siti-rahayu');
    expect($invitation->status)->toBe(InvitationStatus::Draft);
    $response->assertRedirect(route('invitations.edit', $invitation));
});

test('creating an invitation requires both names', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('invitations.store'), ['groom_name' => 'Budi'])
        ->assertSessionHasErrors('bride_name');
});

test('the owner can update invitation fields', function () {
    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->create();

    $this->actingAs($user)->put(route('invitations.update', $invitation), [
        'akad_venue' => 'Masjid Agung',
        'love_story' => 'Kami bertemu di kampus.',
    ])->assertRedirect();

    expect($invitation->fresh()->akad_venue)->toBe('Masjid Agung');
    expect($invitation->fresh()->love_story)->toBe('Kami bertemu di kampus.');
});

test('a non-owner cannot view or update an invitation', function () {
    $invitation = Invitation::factory()->create();
    $intruder = User::factory()->create();

    $this->actingAs($intruder)->get(route('invitations.edit', $invitation))->assertForbidden();
    $this->actingAs($intruder)->put(route('invitations.update', $invitation), [
        'akad_venue' => 'Hacked',
    ])->assertForbidden();
});

test('the slug can be changed while draft but not once active', function () {
    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->draft()->create(['slug' => 'original']);

    $this->actingAs($user)->put(route('invitations.update', $invitation), ['slug' => 'new-slug']);
    expect($invitation->fresh()->slug)->toBe('new-slug');

    $invitation->update(['status' => InvitationStatus::Active]);
    $this->actingAs($user)->put(route('invitations.update', $invitation), ['slug' => 'changed-again']);
    expect($invitation->fresh()->slug)->toBe('new-slug');
});

test('gifts are replaced on sync', function () {
    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->create();
    $invitation->giftAccounts()->create([
        'type' => GiftType::Bank, 'provider_name' => 'Old', 'account_number' => '1', 'account_name' => 'Old', 'sort_order' => 0,
    ]);

    $this->actingAs($user)->put(route('invitations.gifts.update', $invitation), [
        'gifts' => [
            ['type' => 'bank', 'provider_name' => 'BCA', 'account_number' => '123', 'account_name' => 'Budi'],
            ['type' => 'ewallet', 'provider_name' => 'GoPay', 'account_number' => '0812', 'account_name' => 'Siti'],
        ],
    ])->assertRedirect();

    expect($invitation->giftAccounts()->count())->toBe(2);
    expect($invitation->giftAccounts()->pluck('provider_name')->all())->toBe(['BCA', 'GoPay']);
});

test('gallery photos upload to the media disk and can be deleted', function () {
    Storage::fake('public');
    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->create();

    $this->actingAs($user)->post(route('invitations.photos.store', $invitation), [
        'photos' => [UploadedFile::fake()->image('a.jpg'), UploadedFile::fake()->image('b.jpg')],
    ])->assertRedirect();

    expect($invitation->galleryPhotos()->count())->toBe(2);
    Storage::disk('public')->assertExists(
        collect(Storage::disk('public')->allFiles("invitations/{$invitation->id}/gallery"))->first()
    );

    $photo = $invitation->galleryPhotos()->first();
    $this->actingAs($user)->delete(route('invitations.photos.destroy', [$invitation, $photo]))->assertRedirect();
    expect($invitation->galleryPhotos()->count())->toBe(1);
});

test('a photo from another invitation cannot be deleted via the wrong invitation', function () {
    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->create();
    $otherPhoto = GalleryPhoto::factory()->create();

    $this->actingAs($user)
        ->delete(route('invitations.photos.destroy', [$invitation, $otherPhoto]))
        ->assertNotFound();
});

test('guests cannot manage invitations', function () {
    $invitation = Invitation::factory()->create();

    $this->post(route('invitations.store'))->assertRedirect(route('login'));
    $this->put(route('invitations.update', $invitation))->assertRedirect(route('login'));
});
