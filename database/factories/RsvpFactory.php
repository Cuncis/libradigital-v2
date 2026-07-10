<?php

namespace Database\Factories;

use App\Enums\Attendance;
use App\Models\Invitation;
use App\Models\Rsvp;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Rsvp>
 */
class RsvpFactory extends Factory
{
    public function definition(): array
    {
        return [
            'invitation_id' => Invitation::factory(),
            'guest_name' => fake()->name(),
            'attendance' => fake()->randomElement(Attendance::cases()),
            'message' => fake()->optional()->sentence(),
            'ip_address' => fake()->ipv4(),
        ];
    }
}
