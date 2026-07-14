<?php

use App\Models\Invitation;
use App\Models\Template;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * Full-replacement data path: the public page always renders through a node tree
 * (invitation.layout), which is guaranteed present. Visual parity itself is
 * covered by the browser test, which runs in CI.
 */
test('the resolved layout tree is serialized to the public invitation page', function () {
    $template = Template::factory()->classic()->create();
    $invitation = Invitation::factory()->active()->create([
        'template_id' => $template->id,
    ]);

    $this->get(route('invitation.show', $invitation->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('invitation/PublicInvitationPage')
            ->where('invitation.layout.version', 1)
            ->where('invitation.layout.root.type', 'container')
            ->has('invitation.layout.root.children')
            // The hero section is tagged so the couple's floating pack can overlay it.
            ->where('invitation.layout.root.children.0.animationRef.packSection', 'hero')
        );
});

test('an invitation whose template has no custom layout still renders the Classic tree', function () {
    $template = Template::factory()->create(); // no ->classic()
    $invitation = Invitation::factory()->active()->create([
        'template_id' => $template->id,
    ]);

    $this->get(route('invitation.show', $invitation->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('invitation.layout.root.type', 'container')
            ->where('invitation.template.has_custom_layout', false)
        );
});

test('an invitation with no template still renders the default tree', function () {
    $invitation = Invitation::factory()->active()->create([
        'template_id' => null,
    ]);

    $this->get(route('invitation.show', $invitation->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('invitation.template', null)
            ->where('invitation.layout.root.type', 'container')
        );
});
