<?php

namespace App\Enums;

enum BlogCategory: string
{
    case Tips = 'tips';
    case Inspiration = 'inspiration';
    case Guide = 'guide';
    case News = 'news';

    public function label(): string
    {
        return match ($this) {
            self::Tips => 'Tips',
            self::Inspiration => 'Inspirasi',
            self::Guide => 'Panduan',
            self::News => 'Berita',
        };
    }

    /**
     * The category options for display (admin form + public filters).
     *
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(fn (self $category): array => [
            'value' => $category->value,
            'label' => $category->label(),
        ], self::cases());
    }
}
