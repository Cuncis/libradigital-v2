<?php

use App\Enums\AnimationPackSection;
use App\Enums\MotionType;
use App\Enums\Package;
use App\Models\AnimationAsset;
use App\Models\AnimationPack;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

function packAssetPayload(array $overrides = []): array
{
    return array_merge([
        'file' => UploadedFile::fake()->image('petal.png', 200, 200),
        'motion_type' => MotionType::FallDown->value,
        'position_x' => 20,
        'position_y' => 0,
        'width_percent' => 10,
        'opacity' => 0.9,
        'duration_ms' => 3000,
        'delay_ms' => 0,
        'z_index' => 10,
    ], $overrides);
}

test('non-admins cannot manage animation packs', function () {
    $user = User::factory()->create(['is_admin' => false]);

    $this->actingAs($user)->get(route('admin.animation-packs.index'))->assertForbidden();
    $this->actingAs($user)->post(route('admin.animation-packs.store'), [])->assertForbidden();
});

test('an admin can create a pack with assets', function () {
    Storage::fake(config('filesystems.media'));
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->post(route('admin.animation-packs.store'), [
        'name' => 'Pink Blossom',
        'section' => AnimationPackSection::Hero->value,
        'available_for' => [Package::Standard->value, Package::Premium->value],
        'is_active' => true,
        'assets' => [packAssetPayload(), packAssetPayload(['motion_type' => MotionType::Twinkle->value])],
    ])->assertRedirect();

    $pack = AnimationPack::firstOrFail();
    expect($pack->slug)->toBe('pink-blossom');
    expect($pack->assets)->toHaveCount(2);
    expect($pack->thumbnail_url)->not->toBeNull();
    Storage::disk(config('filesystems.media'))->assertExists($pack->assets->first()->asset_path);
});

test('creating a pack requires at least one asset', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->post(route('admin.animation-packs.store'), [
        'name' => 'Empty',
        'section' => AnimationPackSection::Hero->value,
        'available_for' => [Package::Premium->value],
        'assets' => [],
    ])->assertSessionHasErrors('assets');
});

test('an admin can update pack meta and delete a dropped asset', function () {
    Storage::fake(config('filesystems.media'));
    $admin = User::factory()->admin()->create();
    $pack = AnimationPack::factory()->create(['name' => 'Old']);
    $keep = AnimationAsset::factory()->for($pack, 'pack')->create();
    $drop = AnimationAsset::factory()->for($pack, 'pack')->create();

    $this->actingAs($admin)->post(route('admin.animation-packs.update', $pack), [
        'name' => 'New Name',
        'is_active' => false,
        'assets' => [[
            'id' => $keep->id,
            'motion_type' => MotionType::Spin->value,
            'position_x' => 30,
            'position_y' => 10,
            'width_percent' => 12,
            'opacity' => 0.8,
            'duration_ms' => 4000,
            'delay_ms' => 100,
            'z_index' => 5,
        ]],
    ])->assertRedirect();

    expect($pack->refresh()->name)->toBe('New Name');
    expect($pack->is_active)->toBeFalse();
    expect(AnimationAsset::whereKey($drop->id)->exists())->toBeFalse();
    expect($keep->refresh()->motion_type)->toBe(MotionType::Spin);
});

test('deleting a pack clears the slug on invitations that used it', function () {
    $admin = User::factory()->admin()->create();
    $pack = AnimationPack::factory()->create();
    $invitation = Invitation::factory()->create(['animation_pack_slug' => $pack->slug]);

    $this->actingAs($admin)->delete(route('admin.animation-packs.destroy', $pack))->assertRedirect();

    expect(AnimationPack::count())->toBe(0);
    expect($invitation->refresh()->animation_pack_slug)->toBeNull();
});

test('the owner can pick an animation pack in the builder', function () {
    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->create();
    $pack = AnimationPack::factory()->create();

    $this->actingAs($user)->put(route('invitations.update', $invitation), [
        'animation_pack_slug' => $pack->slug,
    ])->assertRedirect();

    expect($invitation->refresh()->animation_pack_slug)->toBe($pack->slug);
});

test('the public page includes an available pack with its assets', function () {
    $pack = AnimationPack::factory()->section(AnimationPackSection::Hero)->create([
        'available_for' => [Package::Premium->value],
    ]);
    AnimationAsset::factory()->for($pack, 'pack')->create();
    $invitation = Invitation::factory()->active()->create([
        'package' => Package::Premium,
        'animation_pack_slug' => $pack->slug,
    ]);

    $this->get(route('invitation.show', $invitation->slug))
        ->assertInertia(fn (Assert $page) => $page
            ->component('invitation/PublicInvitationPage')
            ->where('invitation.animation_pack.slug', $pack->slug)
            ->has('invitation.animation_pack.assets', 1)
        );
});

test('the public page hides a pack the package tier cannot use', function () {
    $pack = AnimationPack::factory()->create(['available_for' => [Package::Signature->value]]);
    AnimationAsset::factory()->for($pack, 'pack')->create();
    $invitation = Invitation::factory()->active()->create([
        'package' => Package::Standard,
        'animation_pack_slug' => $pack->slug,
    ]);

    $this->get(route('invitation.show', $invitation->slug))
        ->assertInertia(fn (Assert $page) => $page
            ->where('invitation.animation_pack_slug', $pack->slug)
            ->missing('invitation.animation_pack')
        );
});
