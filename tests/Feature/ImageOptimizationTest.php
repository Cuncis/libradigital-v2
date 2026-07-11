<?php

use App\Jobs\OptimizeImage;
use App\Models\GalleryPhoto;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Storage;

test('the job converts an uploaded image to a resized webp and removes the original', function () {
    Storage::fake('public');

    $original = UploadedFile::fake()->image('photo.jpg', 2400, 1200)
        ->store('invitations/1/gallery', 'public');

    $photo = GalleryPhoto::factory()->create([
        'path' => $original,
        'photo_url' => Storage::disk('public')->url($original),
    ]);

    (new OptimizeImage($photo, 'path', 'photo_url'))->handle();

    $photo->refresh();

    expect($photo->path)->toEndWith('.webp');
    expect($photo->photo_url)->toContain('.webp');
    expect(Storage::disk('public')->exists($photo->path))->toBeTrue();
    expect(Storage::disk('public')->exists($original))->toBeFalse();

    $info = getimagesizefromstring(Storage::disk('public')->get($photo->path));
    expect($info[2])->toBe(IMAGETYPE_WEBP);
    expect($info[0])->toBeLessThanOrEqual(1600);
});

test('the job is a no-op when the source file is missing', function () {
    Storage::fake('public');

    $photo = GalleryPhoto::factory()->create(['path' => 'missing/file.jpg']);

    (new OptimizeImage($photo, 'path', 'photo_url'))->handle();

    expect($photo->refresh()->path)->toBe('missing/file.jpg');
});

test('uploading gallery photos stores the path and queues optimization', function () {
    Bus::fake();
    Storage::fake('public');

    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->create();

    $this->actingAs($user)->post(route('invitations.photos.store', $invitation), [
        'photos' => [
            UploadedFile::fake()->image('a.jpg'),
            UploadedFile::fake()->image('b.jpg'),
        ],
    ])->assertRedirect();

    expect($invitation->galleryPhotos()->whereNotNull('path')->count())->toBe(2);
    Bus::assertDispatchedTimes(OptimizeImage::class, 2);
});

test('uploading a cover stores the path and queues optimization', function () {
    Bus::fake();
    Storage::fake('public');

    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->create();

    $this->actingAs($user)->post(route('invitations.cover.store', $invitation), [
        'cover' => UploadedFile::fake()->image('cover.jpg'),
    ])->assertRedirect();

    expect($invitation->refresh()->cover_path)->not->toBeNull();
    Bus::assertDispatchedTimes(OptimizeImage::class, 1);
});

test('deleting a gallery photo also removes its stored file', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->create();

    $path = UploadedFile::fake()->image('gone.jpg')->store('invitations/1/gallery', 'public');
    $photo = GalleryPhoto::factory()->for($invitation)->create(['path' => $path]);

    $this->actingAs($user)
        ->delete(route('invitations.photos.destroy', [$invitation, $photo]))
        ->assertRedirect();

    expect(Storage::disk('public')->exists($path))->toBeFalse();
    expect(GalleryPhoto::query()->whereKey($photo->id)->exists())->toBeFalse();
});
