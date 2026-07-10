<?php

use App\Models\User;
use Laravel\Socialite\Contracts\Provider;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

function fakeGoogleUser(string $id, string $name, string $email): SocialiteUser
{
    $user = new SocialiteUser;
    $user->id = $id;
    $user->name = $name;
    $user->email = $email;

    return $user;
}

test('google redirect sends the user to google', function () {
    $provider = Mockery::mock(Provider::class);
    $provider->shouldReceive('redirect')->andReturn(redirect('https://accounts.google.com/o/oauth2/auth'));
    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

    $this->get(route('auth.google.redirect'))
        ->assertRedirectContains('accounts.google.com');
});

test('google callback creates and logs in a new user', function () {
    $provider = Mockery::mock(Provider::class);
    $provider->shouldReceive('user')->andReturn(fakeGoogleUser('google-123', 'Budi Santoso', 'budi@example.com'));
    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

    $response = $this->get(route('auth.google.callback'));

    $response->assertRedirect(route('dashboard'));
    $this->assertAuthenticated();

    $user = User::where('email', 'budi@example.com')->firstOrFail();
    expect($user->google_id)->toBe('google-123');
    expect($user->hasVerifiedEmail())->toBeTrue();
});

test('google callback links an existing email account', function () {
    $existing = User::factory()->create(['email' => 'siti@example.com', 'google_id' => null]);

    $provider = Mockery::mock(Provider::class);
    $provider->shouldReceive('user')->andReturn(fakeGoogleUser('google-999', 'Siti', 'siti@example.com'));
    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

    $this->get(route('auth.google.callback'))->assertRedirect(route('dashboard'));

    expect(User::where('email', 'siti@example.com')->count())->toBe(1);
    expect($existing->fresh()->google_id)->toBe('google-999');
});

test('google callback failure redirects back to login', function () {
    $provider = Mockery::mock(Provider::class);
    $provider->shouldReceive('user')->andThrow(new RuntimeException('denied'));
    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

    $this->get(route('auth.google.callback'))
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors('email');

    $this->assertGuest();
});
