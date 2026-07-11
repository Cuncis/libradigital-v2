<?php

namespace Database\Factories;

use App\Enums\Package;
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
            'is_premium' => false,
            'min_package' => Package::Starter,
            'is_active' => true,
        ];
    }

    public function premium(): static
    {
        return $this->state(fn () => [
            'is_premium' => true,
            'min_package' => Package::Premium,
        ]);
    }

    public function requires(Package $package): static
    {
        return $this->state(fn () => [
            'is_premium' => $package !== Package::Starter,
            'min_package' => $package,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
