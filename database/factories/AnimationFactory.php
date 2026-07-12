<?php

namespace Database\Factories;

use App\Enums\AnimationEffect;
use App\Enums\AnimationSection;
use App\Models\Animation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Animation>
 */
class AnimationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(2, true),
            'section' => fake()->randomElement(AnimationSection::cases()),
            'effect' => AnimationEffect::Fade,
            'asset_path' => null,
            'asset_url' => null,
            'is_active' => true,
            'sort_order' => 0,
        ];
    }

    public function cover(AnimationEffect $effect = AnimationEffect::CurtainSplit): static
    {
        return $this->state(fn (): array => [
            'section' => AnimationSection::Cover,
            'effect' => $effect,
        ]);
    }
}
