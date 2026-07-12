<?php

namespace App\Enums;

enum AnimationSection: string
{
    case Cover = 'cover';
    case Header = 'header';
    case Countdown = 'countdown';
    case LoveStory = 'love_story';
    case Rsvp = 'rsvp';
    case Gift = 'gift';

    /**
     * Indonesian label shown to admins and couples.
     */
    public function label(): string
    {
        return match ($this) {
            self::Cover => 'Cover / Pembuka',
            self::Header => 'Header',
            self::Countdown => 'Menuju Hari Bahagia',
            self::LoveStory => 'Kisah Kami',
            self::Rsvp => 'Konfirmasi Kehadiran',
            self::Gift => 'Angpao Digital',
        };
    }

    /**
     * The cover has its own richer family of "opening" effects (curtain, doors);
     * every other section uses scroll-reveal entrance effects.
     */
    public function isCover(): bool
    {
        return $this === self::Cover;
    }

    /**
     * Catalog for building select options on the frontend.
     *
     * @return list<array{value: string, label: string, is_cover: bool}>
     */
    public static function catalog(): array
    {
        return array_map(
            fn (self $section): array => [
                'value' => $section->value,
                'label' => $section->label(),
                'is_cover' => $section->isCover(),
            ],
            self::cases(),
        );
    }
}
