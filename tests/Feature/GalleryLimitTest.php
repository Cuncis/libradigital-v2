<?php

use App\Enums\Addon;
use App\Enums\Package;
use App\Models\GalleryPhoto;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('the effective gallery limit combines package tier and the add-on', function () {
    $standard = Invitation::factory()->create(['package' => Package::Standard]);
    expect($standard->galleryLimit())->toBe(20);

    $withAddon = Invitation::factory()->create([
        'package' => Package::Standard,
        'addons' => [Addon::ExtraGallery->value],
    ]);
    expect($withAddon->galleryLimit())->toBe(70);

    // A draft with no package yet falls back to the highest tier so building
    // is not blocked before checkout.
    $draft = Invitation::factory()->create(['package' => null]);
    expect($draft->galleryLimit())->toBe(100);
});

test('uploading beyond the effective gallery limit is rejected', function () {
    Bus::fake();
    Storage::fake('public');

    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->create(['package' => Package::Standard]);
    GalleryPhoto::factory()->count(20)->for($invitation)->create();

    $this->actingAs($user)->post(route('invitations.photos.store', $invitation), [
        'photos' => [UploadedFile::fake()->image('over.jpg')],
    ])->assertSessionHasErrors('photos');

    expect($invitation->galleryPhotos()->count())->toBe(20);
});

test('the extra_gallery add-on raises the upload allowance', function () {
    Bus::fake();
    Storage::fake('public');

    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->create([
        'package' => Package::Standard,
        'addons' => [Addon::ExtraGallery->value],
    ]);
    GalleryPhoto::factory()->count(20)->for($invitation)->create();

    $this->actingAs($user)->post(route('invitations.photos.store', $invitation), [
        'photos' => [UploadedFile::fake()->image('ok.jpg')],
    ])->assertRedirect();

    expect($invitation->galleryPhotos()->count())->toBe(21);
});

test('the public page only displays photos up to the effective limit', function () {
    $invitation = Invitation::factory()->active()->create(['package' => Package::Standard]);
    GalleryPhoto::factory()->count(25)->for($invitation)->create();

    $this->get(route('invitation.show', $invitation->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('invitation.gallery_photos', 20),
        );
});
