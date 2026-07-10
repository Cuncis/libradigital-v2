<?php

namespace Database\Factories;

use App\Enums\TemplateCategory;
use App\Models\Template;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Template>
 */
class TemplateFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'name' => Str::title($name),
            'slug' => Str::slug($name),
            'category' => fake()->randomElement(TemplateCategory::cases()),
            'thumbnail' => 'https://placehold.co/400x600',
            'is_premium' => fake()->boolean(30),
            'is_active' => true,
        ];
    }

    public function premium(): static
    {
        return $this->state(fn () => ['is_premium' => true]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
