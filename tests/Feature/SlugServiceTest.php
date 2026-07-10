<?php

use App\Models\Invitation;
use App\Services\SlugService;

beforeEach(function () {
    $this->service = app(SlugService::class);
});

test('it slugifies the couple names', function () {
    expect($this->service->generate('Budi Santoso', 'Siti Rahayu'))
        ->toBe('budi-santoso-siti-rahayu');
});

test('it appends an incrementing suffix on collision', function () {
    Invitation::factory()->create(['slug' => 'budi-siti']);
    Invitation::factory()->create(['slug' => 'budi-siti-2']);

    expect($this->service->generate('Budi', 'Siti'))->toBe('budi-siti-3');
});

test('it ignores the given invitation id when checking uniqueness', function () {
    $invitation = Invitation::factory()->create(['slug' => 'budi-siti']);

    expect($this->service->generate('Budi', 'Siti', ignoreId: $invitation->id))
        ->toBe('budi-siti');
});

test('it falls back to a default base when names are not sluggable', function () {
    expect($this->service->generate('!!!', '???'))->toBe('undangan');
});

test('it caps the slug length', function () {
    $slug = $this->service->generate(str_repeat('a', 200), str_repeat('b', 200));

    expect(strlen($slug))->toBeLessThanOrEqual(100);
});
