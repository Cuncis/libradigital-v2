<?php

use App\Enums\Attendance;
use App\Models\Invitation;
use App\Models\Rsvp;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('a guest can submit an rsvp to an active invitation', function () {
    $invitation = Invitation::factory()->active()->create();

    $response = $this->postJson(route('invitation.rsvp.store', $invitation->slug), [
        'guest_name' => 'Andi',
        'attendance' => 'hadir',
        'message' => 'Selamat menempuh hidup baru!',
    ]);

    $response->assertCreated()
        ->assertJson([
            'success' => true,
            'message' => 'Terima kasih atas ucapan dan konfirmasi kehadiran Anda.',
            'data' => ['guest_name' => 'Andi', 'attendance' => 'hadir'],
        ]);

    expect(Rsvp::where('invitation_id', $invitation->id)->where('guest_name', 'Andi')->exists())->toBeTrue();
});

test('rsvp validation errors return 422', function () {
    $invitation = Invitation::factory()->active()->create();

    $this->postJson(route('invitation.rsvp.store', $invitation->slug), [
        'guest_name' => '',
        'attendance' => 'maybe',
    ])->assertStatus(422)->assertJsonValidationErrors(['guest_name', 'attendance']);
});

test('rsvp to a draft invitation returns 404', function () {
    $invitation = Invitation::factory()->draft()->create();

    $this->postJson(route('invitation.rsvp.store', $invitation->slug), [
        'guest_name' => 'Andi',
        'attendance' => 'hadir',
    ])->assertNotFound();
});

test('rsvp endpoint is rate limited to 5 per minute', function () {
    $invitation = Invitation::factory()->active()->create();

    foreach (range(1, 5) as $i) {
        $this->postJson(route('invitation.rsvp.store', $invitation->slug), [
            'guest_name' => "Tamu {$i}", 'attendance' => 'hadir',
        ])->assertCreated();
    }

    $this->postJson(route('invitation.rsvp.store', $invitation->slug), [
        'guest_name' => 'Tamu 6', 'attendance' => 'hadir',
    ])->assertTooManyRequests();
});

test('the owner sees the rsvp list with a summary', function () {
    $this->withoutVite();
    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->create();
    Rsvp::factory()->for($invitation)->count(2)->create(['attendance' => Attendance::Hadir]);
    Rsvp::factory()->for($invitation)->create(['attendance' => Attendance::TidakHadir]);

    $this->actingAs($user)->get(route('invitations.rsvps.index', $invitation))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/rsvps')
            ->where('summary.hadir', 2)
            ->where('summary.tidak_hadir', 1)
            ->where('summary.total', 3)
            ->has('rsvps.data', 3),
        );
});

test('a non-owner cannot see the rsvp list or export', function () {
    $invitation = Invitation::factory()->create();
    $intruder = User::factory()->create();

    $this->actingAs($intruder)->get(route('invitations.rsvps.index', $invitation))->assertForbidden();
    $this->actingAs($intruder)->get(route('invitations.rsvps.export', $invitation))->assertForbidden();
});

test('the owner can export rsvps as csv', function () {
    $user = User::factory()->create();
    $invitation = Invitation::factory()->for($user)->create();
    Rsvp::factory()->for($invitation)->create(['guest_name' => 'Rina', 'attendance' => Attendance::Hadir]);

    $response = $this->actingAs($user)->get(route('invitations.rsvps.export', $invitation));

    $response->assertOk();
    expect($response->headers->get('content-type'))->toContain('text/csv');
    expect($response->streamedContent())->toContain('Rina')->toContain('Nama Tamu');
});
