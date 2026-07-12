<?php

use App\Enums\AnimationEffect;
use App\Enums\AnimationSection;
use App\Models\Animation;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('non-admins cannot manage animations', function () {
    $user = User::factory()->create(['is_admin' => false]);

    $this->actingAs($user)->get(route('admin.animations.index'))->assertForbidden();
    $this->actingAs($user)->post(route('admin.animations.store'), [])->assertForbidden();
});

test('an admin can create an animation with an uploaded asset', function () {
    Storage::fake(config('filesystems.media'));
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.animations.store'), [
            'name' => 'Tirai Merah',
            'section' => AnimationSection::Cover->value,
            'effect' => AnimationEffect::CurtainSplit->value,
            'asset' => UploadedFile::fake()->image('curtain.png'),
            'is_active' => true,
        ])
        ->assertRedirect();

    $animation = Animation::firstOrFail();
    expect($animation->name)->toBe('Tirai Merah');
    expect($animation->section)->toBe(AnimationSection::Cover);
    expect($animation->effect)->toBe(AnimationEffect::CurtainSplit);
    expect($animation->asset_path)->not->toBeNull();
    Storage::disk(config('filesystems.media'))->assertExists($animation->asset_path);
});

test('an admin can update and delete an animation', function () {
    $admin = User::factory()->admin()->create();
    $animation = Animation::factory()->create(['name' => 'Old']);

    $this->actingAs($admin)
        ->post(route('admin.animations.update', $animation), [
            'name' => 'New Name',
            'is_active' => false,
        ])
        ->assertRedirect();

    expect($animation->refresh()->name)->toBe('New Name');
    expect($animation->is_active)->toBeFalse();

    $this->actingAs($admin)
        ->delete(route('admin.animations.destroy', $animation))
        ->assertRedirect();

    expect(Animation::count())->toBe(0);
});

test('store validation rejects an invalid section or effect', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.animations.store'), [
            'name' => 'Broken',
            'section' => 'not-a-section',
            'effect' => 'not-an-effect',
        ])
        ->assertSessionHasErrors(['section', 'effect']);
});

test('the owner can save per-section animation choices from the builder', function () {
    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->create();
    $cover = Animation::factory()->cover()->create();
    $story = Animation::factory()->create([
        'section' => AnimationSection::LoveStory,
        'effect' => AnimationEffect::SlideLeft,
    ]);

    $this->actingAs($user)
        ->put(route('invitations.update', $invitation), [
            'animations' => [
                'cover' => $cover->id,
                'love_story' => $story->id,
            ],
        ])
        ->assertRedirect();

    expect($invitation->animationSelections()->count())->toBe(2);
    expect(
        $invitation->animationSelections()
            ->where('section', AnimationSection::Cover->value)
            ->value('animation_id')
    )->toBe($cover->id);
});

test('passing a null selection clears that section', function () {
    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->create();
    $cover = Animation::factory()->cover()->create();

    $this->actingAs($user)->put(route('invitations.update', $invitation), [
        'animations' => ['cover' => $cover->id],
    ]);
    expect($invitation->animationSelections()->count())->toBe(1);

    $this->actingAs($user)->put(route('invitations.update', $invitation), [
        'animations' => ['cover' => null],
    ]);
    expect($invitation->animationSelections()->count())->toBe(0);
});

test('the public invitation serializes chosen animations per section', function () {
    $cover = Animation::factory()->cover(AnimationEffect::CurtainSplit)->create([
        'asset_url' => 'https://cdn.test/curtain.png',
    ]);
    $invitation = Invitation::factory()->active()->create();
    $invitation->animationSelections()->create([
        'section' => AnimationSection::Cover->value,
        'animation_id' => $cover->id,
    ]);

    $this->get(route('invitation.show', $invitation->slug))
        ->assertInertia(fn (Assert $page) => $page
            ->component('invitation/PublicInvitationPage')
            ->where('invitation.animations.cover.effect', AnimationEffect::CurtainSplit->value)
            ->where('invitation.animations.cover.asset_url', 'https://cdn.test/curtain.png')
        );
});
