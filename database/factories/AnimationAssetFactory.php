<?php

namespace Database\Factories;

use App\Enums\MotionType;
use App\Models\AnimationAsset;
use App\Models\AnimationPack;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AnimationAsset>
 */
class AnimationAssetFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'pack_id' => AnimationPack::factory(),
            'asset_path' => null,
            'asset_url' => 'https://placehold.co/200x200/ffb6c1/ffffff/png?text=%E2%9D%80',
            'motion_type' => fake()->randomElement(MotionType::cases()),
            'position_x' => fake()->numberBetween(5, 90),
            'position_y' => fake()->numberBetween(0, 80),
            'width_percent' => fake()->numberBetween(6, 16),
            'opacity' => fake()->randomFloat(2, 0.4, 1),
            'duration_ms' => fake()->numberBetween(2000, 6000),
            'delay_ms' => fake()->numberBetween(0, 2000),
            'repeat_count' => -1,
            'z_index' => 10,
            'sort_order' => 0,
        ];
    }
}
