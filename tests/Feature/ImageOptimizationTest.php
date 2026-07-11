<?php

use App\Jobs\OptimizeImage;
use App\Models\GalleryPhoto;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Log;
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

test('the optimization job is configured for safe retries', function () {
    $job = new OptimizeImage(GalleryPhoto::factory()->create(), 'path', 'photo_url');

    expect($job->tries)->toBe(3);
    expect($job->timeout)->toBeLessThan(90); // must stay under the queue retry_after
    expect($job->deleteWhenMissingModels)->toBeTrue();
    expect($job->backoff())->toBe([10, 30, 60]);
});

test('a failed optimization is logged without touching the original', function () {
    Storage::fake('public');
    Log::spy();

    $original = UploadedFile::fake()->image('keep.jpg')->store('invitations/1/gallery', 'public');
    $photo = GalleryPhoto::factory()->create([
        'path' => $original,
        'photo_url' => Storage::disk('public')->url($original),
    ]);

    (new OptimizeImage($photo, 'path', 'photo_url'))->failed(new RuntimeException('boom'));

    Log::shouldHaveReceived('warning')
        ->once()
        ->withArgs(fn (string $message) => $message === 'OptimizeImage failed');

    // The original file and columns are left intact for a retry/manual reprocess.
    expect(Storage::disk('public')->exists($original))->toBeTrue();
    expect($photo->refresh()->path)->toBe($original);
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
