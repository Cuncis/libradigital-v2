<?php

use App\Enums\TemplateCategory;
use App\Models\Invitation;
use App\Models\Template;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(fn () => $this->withoutVite());

test('an active invitation renders with server-side OG meta tags', function () {
    $invitation = Invitation::factory()->active()->create([
        'groom_name' => 'Budi',
        'bride_name' => 'Siti',
        'wedding_date' => '2026-12-20 08:00:00',
        'cover_photo' => 'https://cdn.example.com/cover.jpg',
    ]);

    $response = $this->get(route('invitation.show', $invitation->slug));

    $response->assertOk();
    $response->assertSee('<meta property="og:title" content="Undangan Pernikahan Budi &amp; Siti">', false);
    $response->assertSee('property="og:image" content="https://cdn.example.com/cover.jpg"', false);
    $response->assertSee('name="twitter:card" content="summary_large_image"', false);
    $response->assertSee('Kami mengundang Anda untuk hadir di pernikahan kami pada 20 Desember 2026', false);
    $response->assertSee('property="og:url" content="'.route('invitation.show', $invitation->slug).'"', false);
});

test('the invitation data is passed to the react page as a prop', function () {
    $invitation = Invitation::factory()->active()->create();

    $this->get(route('invitation.show', $invitation->slug))
        ->assertInertia(fn (Assert $page) => $page
            ->component('invitation/PublicInvitationPage')
            ->where('invitation.slug', $invitation->slug)
            ->where('invitation.status', 'active'),
        );
});

test('the template category is exposed so the client can resolve the theme', function () {
    $template = Template::factory()->create(['category' => TemplateCategory::Javanese]);
    $invitation = Invitation::factory()->active()->for($template)->create();

    $this->get(route('invitation.show', $invitation->slug))
        ->assertInertia(fn (Assert $page) => $page
            ->where('invitation.template.category', 'javanese'),
        );
});

test('a draft invitation returns 404', function () {
    $invitation = Invitation::factory()->draft()->create();

    $this->get(route('invitation.show', $invitation->slug))->assertNotFound();
});

test('an expired invitation returns 404', function () {
    $invitation = Invitation::factory()->expired()->create();

    $this->get(route('invitation.show', $invitation->slug))->assertNotFound();
});

test('an unknown slug returns 404', function () {
    $this->get(route('invitation.show', 'tidak-ada'))->assertNotFound();
});
