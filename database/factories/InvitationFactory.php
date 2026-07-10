<?php

namespace Database\Factories;

use App\Enums\InvitationStatus;
use App\Enums\Timezone;
use App\Models\Invitation;
use App\Models\Template;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Invitation>
 */
class InvitationFactory extends Factory
{
    public function definition(): array
    {
        $groom = fake()->firstNameMale();
        $bride = fake()->firstNameFemale();
        $weddingDate = fake()->dateTimeBetween('+1 month', '+1 year');

        return [
            'user_id' => User::factory(),
            'slug' => Str::slug($groom.'-'.$bride).'-'.fake()->unique()->numberBetween(1, 99999),
            'status' => InvitationStatus::Draft,
            'template_id' => Template::factory(),
            'groom_name' => $groom,
            'bride_name' => $bride,
            'wedding_date' => $weddingDate,
            'timezone' => Timezone::WIB,
            'akad_venue' => fake()->company(),
            'akad_address' => fake()->address(),
            'akad_datetime' => $weddingDate,
            'resepsi_venue' => fake()->company(),
            'resepsi_address' => fake()->address(),
            'resepsi_datetime' => $weddingDate,
            'maps_url_akad' => 'https://maps.google.com/?q='.fake()->latitude().','.fake()->longitude(),
            'maps_url_resepsi' => 'https://maps.google.com/?q='.fake()->latitude().','.fake()->longitude(),
            'cover_photo' => 'https://placehold.co/1200x1600',
            'love_story' => fake()->paragraph(),
            'music_url' => null,
            'visitor_count' => 0,
        ];
    }

    public function published(): static
    {
        return $this->state(fn () => ['status' => InvitationStatus::Published]);
    }

    public function draft(): static
    {
        return $this->state(fn () => ['status' => InvitationStatus::Draft]);
    }
}
