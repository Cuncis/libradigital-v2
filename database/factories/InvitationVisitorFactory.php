<?php

namespace Database\Factories;

use App\Models\Invitation;
use App\Models\InvitationVisitor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InvitationVisitor>
 */
class InvitationVisitorFactory extends Factory
{
    public function definition(): array
    {
        return [
            'invitation_id' => Invitation::factory(),
            'ip_address' => fake()->ipv4(),
            'session_id' => fake()->uuid(),
            'visited_at' => now(),
        ];
    }
}
