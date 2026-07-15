<?php

use App\Models\Template;
use App\Models\User;

test('the admin builder loads without javascript errors and can add and save an element', function () {
    $admin = User::factory()->admin()->create();
    $template = Template::factory()->create(['name' => 'Test Builder']);

    $this->actingAs($admin);

    $page = visit(route('admin.templates.builder', $template));

    $page->assertNoJavaScriptErrors()
        ->assertSee('Test Builder')
        ->assertSee('Tambah Elemen')
        ->assertSee('Struktur');

    // Add a text element via the palette, then confirm the inspector opens for it.
    $page->click('text')
        ->assertSee('Konten')
        ->assertSee('Simpan Layout');

    // Persist the layout.
    $page->click('Simpan Layout');

    expect($template->fresh()->layout)->not->toBeNull();
});
