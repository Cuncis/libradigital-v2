<?php

namespace Database\Seeders;

use App\Enums\TemplateCategory;
use App\Models\Template;
use Illuminate\Database\Seeder;

class TemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'name' => 'Javanese Elegance',
                'slug' => 'javanese-elegance',
                'category' => TemplateCategory::Javanese,
                'thumbnail' => 'https://placehold.co/400x600/8B6F47/FFFFFF?text=Javanese+Elegance',
                'is_premium' => false,
            ],
            [
                'name' => 'Sundanese Gold',
                'slug' => 'sundanese-gold',
                'category' => TemplateCategory::Sundanese,
                'thumbnail' => 'https://placehold.co/400x600/C9A227/FFFFFF?text=Sundanese+Gold',
                'is_premium' => true,
            ],
            [
                'name' => 'Modern Minimalist',
                'slug' => 'modern-minimalist',
                'category' => TemplateCategory::Modern,
                'thumbnail' => 'https://placehold.co/400x600/1F2937/FFFFFF?text=Modern+Minimalist',
                'is_premium' => false,
            ],
        ];

        foreach ($templates as $template) {
            Template::updateOrCreate(
                ['slug' => $template['slug']],
                [...$template, 'is_active' => true],
            );
        }
    }
}
