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
            ->has('sampleInvitation.groom_name')
        );
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

test('saving rejects a malformed layout', function () {
    $admin = User::factory()->admin()->create();
    $template = Template::factory()->create();

    $this->actingAs($admin)
        ->put(route('admin.templates.update', $template), ['layout' => ['nope' => true]])
        ->assertSessionHasErrors('layout.version');
});
