<?php

namespace App\Enums;

enum AnimationEffect: string
{
    // Cover "opening" effects.
    case CurtainSplit = 'curtain_split';
    case Doors = 'doors';
    case CoverSlideUp = 'cover_slide_up';
    case CoverZoom = 'cover_zoom';
    case CoverFade = 'cover_fade';

    // Section scroll-reveal effects.
    case Fade = 'fade';
    case SlideUp = 'slide_up';
    case SlideLeft = 'slide_left';
    case SlideRight = 'slide_right';
    case Zoom = 'zoom';

    /**
     * Indonesian label shown to admins.
     */
    public function label(): string
    {
        return match ($this) {
            self::CurtainSplit => 'Tirai Terbuka (Curtain Split)',
            self::Doors => 'Pintu Terbuka (Doors)',
            self::CoverSlideUp => 'Cover Geser ke Atas',
            self::CoverZoom => 'Cover Zoom',
            self::CoverFade => 'Cover Memudar',
            self::Fade => 'Muncul Perlahan (Fade)',
            self::SlideUp => 'Geser dari Bawah',
            self::SlideLeft => 'Geser dari Kiri',
            self::SlideRight => 'Geser dari Kanan',
            self::Zoom => 'Membesar (Zoom)',
        };
    }

    /**
     * Curtain and doors are built around an uploaded PNG asset that physically
     * moves aside; the rest work with or without one.
     */
    public function requiresAsset(): bool
    {
        return in_array($this, [self::CurtainSplit, self::Doors], true);
    }

    /**
     * Whether this effect belongs to the cover "opening" family.
     */
    public function isCoverEffect(): bool
    {
        return in_array($this, [
            self::CurtainSplit,
            self::Doors,
            self::CoverSlideUp,
            self::CoverZoom,
            self::CoverFade,
        ], true);
    }

    /**
     * Catalog for building select options on the frontend.
     *
     * @return list<array{value: string, label: string, requires_asset: bool, is_cover: bool}>
     */
    public static function catalog(): array
    {
        return array_map(
            fn (self $effect): array => [
                'value' => $effect->value,
                'label' => $effect->label(),
                'requires_asset' => $effect->requiresAsset(),
                'is_cover' => $effect->isCoverEffect(),
            ],
            self::cases(),
        );
    }
}
