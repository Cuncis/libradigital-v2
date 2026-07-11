<?php

namespace Database\Factories;

use App\Enums\BlogCategory;
use App\Enums\BlogStatus;
use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<BlogPost>
 */
class BlogPostFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->unique()->sentence(6);

        return [
            'author_id' => User::factory()->admin(),
            'title' => rtrim($title, '.'),
            'slug' => Str::slug($title).'-'.fake()->unique()->numberBetween(1, 99999),
            'category' => fake()->randomElement(BlogCategory::cases()),
            'status' => BlogStatus::Published,
            'cover_path' => null,
            'cover_url' => 'https://placehold.co/1200x630/E11D48/FFFFFF?text=Blog',
            'excerpt' => fake()->sentence(15),
            'body' => collect(fake()->paragraphs(6))->implode("\n\n"),
            'published_at' => fake()->dateTimeBetween('-3 months', 'now'),
        ];
    }

    public function draft(): static
    {
        return $this->state(fn () => [
            'status' => BlogStatus::Draft,
            'published_at' => null,
        ]);
    }

    public function published(): static
    {
        return $this->state(fn () => [
            'status' => BlogStatus::Published,
            'published_at' => now()->subDay(),
        ]);
    }
}
