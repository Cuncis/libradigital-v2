<?php

namespace Database\Factories;

use App\Enums\GiftType;
use App\Models\GiftAccount;
use App\Models\Invitation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GiftAccount>
 */
class GiftAccountFactory extends Factory
{
    public function definition(): array
    {
        return [
            'invitation_id' => Invitation::factory(),
            'type' => fake()->randomElement(GiftType::cases()),
            'provider_name' => fake()->randomElement(['BCA', 'Mandiri', 'BNI', 'GoPay', 'OVO', 'DANA']),
            'account_number' => (string) fake()->numerify('##########'),
            'account_name' => fake()->name(),
            'sort_order' => 0,
        ];
    }
}
