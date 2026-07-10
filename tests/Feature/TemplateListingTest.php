<?php

use App\Enums\TemplateCategory;
use App\Models\Template;

test('it lists only active templates', function () {
    Template::factory()->create(['name' => 'Active One', 'is_active' => true]);
    Template::factory()->inactive()->create(['name' => 'Hidden One']);

    $response = $this->getJson(route('templates.index'));

    $response->assertOk()->assertJsonPath('success', true);
    $names = collect($response->json('data'))->pluck('name');
    expect($names)->toContain('Active One')->not->toContain('Hidden One');
});

test('it filters templates by category', function () {
    Template::factory()->create(['category' => TemplateCategory::Javanese]);
    Template::factory()->create(['category' => TemplateCategory::Modern]);

    $response = $this->getJson(route('templates.index', ['category' => 'javanese']));

    $response->assertOk();
    $categories = collect($response->json('data'))->pluck('category')->unique();
    expect($categories->all())->toBe(['javanese']);
});
