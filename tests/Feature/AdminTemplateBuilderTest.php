<?php

use App\Models\Template;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('non-admins cannot reach the template builder', function (string $routeName) {
    $template = Template::factory()->create();
    $user = User::factory()->create(['is_admin' => false]);

    $this->actingAs($user)
        ->get(route($routeName, $template))
        ->assertForbidden();
})->with(['admin.templates.index', 'admin.templates.builder']);

test('the admin can list templates', function () {
    $admin = User::factory()->admin()->create();
    Template::factory()->create(['name' => 'Javanese Elegance']);

    $this->actingAs($admin)
        ->get(route('admin.templates.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/templates/index')
            ->has('templates', 1)
            ->where('templates.0.name', 'Javanese Elegance')
        );
});

test('opening the builder seeds the Classic tree when a template has no layout', function () {
    $admin = User::factory()->admin()->create();
    $template = Template::factory()->create(); // layout is null

    $this->actingAs($admin)
        ->get(route('admin.templates.builder', $template))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/templates/builder')
            ->where('template.layout.version', 1)
            ->has('template.layout.root.children')
            // The cover tree is seeded too, so the Cover tab always has a base.
            ->where('template.cover.version', 1)
            ->where('template.cover.root.type', 'section')
            ->has('template.cover.root.children')
            ->has('sampleInvitation.groom_name')
        );
});

test('the admin can preview a template through the public page', function () {
    $admin = User::factory()->admin()->create();
    $template = Template::factory()->create(['name' => 'Modern Bloom']);

    $this->actingAs($admin)
        ->get(route('admin.templates.preview', $template))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('invitation/PublicInvitationPage')
            // The sample invitation carries the template's resolved layout + theme.
            ->has('invitation.layout.root')
            ->where('invitation.template.id', $template->id)
            ->has('invitation.groom_name')
        );
});

test('non-admins cannot preview a template', function () {
    $template = Template::factory()->create();
    $user = User::factory()->create(['is_admin' => false]);

    $this->actingAs($user)
        ->get(route('admin.templates.preview', $template))
        ->assertForbidden();
});

test('the admin can save a layout tree', function () {
    $admin = User::factory()->admin()->create();
    $template = Template::factory()->create();

    $layout = Template::defaultLayout();

    $this->actingAs($admin)
        ->put(route('admin.templates.update', $template), ['layout' => $layout])
        ->assertRedirect();

    $fresh = $template->fresh();
    expect($fresh->layout['version'])->toBe(1)
        ->and($fresh->builder_version)->toBe(1)
        ->and($fresh->layout['root']['type'])->toBe('container')
        // The full tree must survive: node fields without explicit validation
        // rules (style, container layout) must not be stripped on save.
        ->and($fresh->layout['root'])->toHaveKey('style')
        ->and($fresh->layout['root']['layout'])->toBe('stack')
        ->and($fresh->layout['root']['children'][0])->toHaveKey('style');
});

test('the admin can save per-device responsive overrides', function () {
    $admin = User::factory()->admin()->create();
    $template = Template::factory()->create();

    $layout = Template::defaultLayout();
    // Attach a mobile-only override carrying both style and container-layout keys.
    $layout['root']['children'][0]['responsive'] = [
        'mobile' => [
            'align' => 'start',
            'size' => 'sm',
            'layout' => 'stack',
            'columns' => 1,
        ],
    ];

    $this->actingAs($admin)
        ->put(route('admin.templates.update', $template), ['layout' => $layout])
        ->assertRedirect();

    $child = $template->fresh()->layout['root']['children'][0];

    // The override must survive the round-trip untouched (no validation stripping).
    expect($child['responsive']['mobile'])->toBe([
        'align' => 'start',
        'size' => 'sm',
        'layout' => 'stack',
        'columns' => 1,
    ]);
});

test('the admin can save a cover tree with button/lottie/motion nodes', function () {
    $admin = User::factory()->admin()->create();
    $template = Template::factory()->create();

    $layout = Template::defaultLayout();
    $cover = Template::defaultCover();
    // A Lottie layer with looping motion alongside the seeded open button.
    $cover['root']['children'][] = [
        'id' => 'cover_lottie',
        'type' => 'lottie',
        'loop' => true,
        'speed' => 1.5,
        'style' => ['motion' => 'float'],
        'src' => ['kind' => 'literal', 'value' => 'https://cdn.test/heart.json'],
    ];

    $this->actingAs($admin)
        ->put(route('admin.templates.update', $template), [
            'layout' => $layout,
            'cover' => $cover,
        ])
        ->assertRedirect();

    $fresh = $template->fresh();
    $children = $fresh->cover['root']['children'];

    expect($fresh->cover['version'])->toBe(1)
        ->and($fresh->cover['root']['type'])->toBe('section')
        // The seeded open button survives with its action intact.
        ->and(collect($children)->firstWhere('type', 'button')['action'])->toBe('open')
        // The lottie node round-trips with its motion style and settings.
        ->and(collect($children)->firstWhere('type', 'lottie'))->toMatchArray([
            'speed' => 1.5,
            'style' => ['motion' => 'float'],
        ]);
});

test('saving without a cover keeps the legacy cover (null)', function () {
    $admin = User::factory()->admin()->create();
    $template = Template::factory()->create();

    $this->actingAs($admin)
        ->put(route('admin.templates.update', $template), ['layout' => Template::defaultLayout()])
        ->assertRedirect();

    expect($template->fresh()->cover)->toBeNull();
});

test('saving rejects a malformed layout', function () {
    $admin = User::factory()->admin()->create();
    $template = Template::factory()->create();

    $this->actingAs($admin)
        ->put(route('admin.templates.update', $template), ['layout' => ['nope' => true]])
        ->assertSessionHasErrors('layout.version');
});
