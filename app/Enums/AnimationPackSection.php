<?php

namespace App\Enums;

enum AnimationPackSection: string
{
    case Hero = 'hero';
    case Gallery = 'gallery';
    case Story = 'story';
    case Event = 'event';
    case Footer = 'footer';
    case FullPage = 'full_page';

    public function label(): string
    {
        return match ($this) {
            self::Hero => 'Hero / Pembuka',
            self::Gallery => 'Galeri',
            self::Story => 'Kisah Kami',
            self::Event => 'Acara (Akad & Resepsi)',
            self::Footer => 'Footer',
            self::FullPage => 'Seluruh Halaman',
        };
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function catalog(): array
    {
        return array_map(
            fn (self $section): array => [
                'value' => $section->value,
                'label' => $section->label(),
            ],
            self::cases(),
        );
    }
}
