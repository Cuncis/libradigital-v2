<?php

namespace Database\Factories;

use App\Enums\AnimationPackSection;
use App\Enums\Package;
use App\Models\AnimationPack;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<AnimationPack>
 */
class AnimationPackFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'name' => $name,
            'slug' => Str::slug($name).'-'.fake()->unique()->numberBetween(1, 99999),
            'section' => fake()->randomElement(AnimationPackSection::cases()),
            'thumbnail_url' => null,
            'available_for' => [
                Package::Standard->value,
                Package::Premium->value,
                Package::Signature->value,
            ],
            'is_active' => true,
            'sort_order' => 0,
            'created_by' => null,
        ];
    }

    public function section(AnimationPackSection $section): static
    {
        return $this->state(fn (): array => ['section' => $section]);
    }
}
