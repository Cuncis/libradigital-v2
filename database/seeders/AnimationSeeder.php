<?php

namespace Database\Seeders;

use App\Enums\AnimationEffect;
use App\Enums\AnimationSection;
use App\Models\Animation;
use Illuminate\Database\Seeder;

class AnimationSeeder extends Seeder
{
    /**
     * Seed the built-in, asset-free animations couples can pick right away.
     * Asset-based effects (curtain, doors) are added by admins via the panel.
     */
    public function run(): void
    {
        $defaults = [
            // Cover openers.
            [AnimationSection::Cover, AnimationEffect::CoverFade, 'Cover Memudar', 0],
            [AnimationSection::Cover, AnimationEffect::CoverSlideUp, 'Cover Geser ke Atas', 1],
            [AnimationSection::Cover, AnimationEffect::CoverZoom, 'Cover Zoom', 2],

            // Section reveals reused across the remaining sections.
            [AnimationSection::Header, AnimationEffect::Fade, 'Header Fade', 0],
            [AnimationSection::Header, AnimationEffect::Zoom, 'Header Zoom', 1],
            [AnimationSection::Countdown, AnimationEffect::SlideUp, 'Countdown Geser Naik', 0],
            [AnimationSection::Countdown, AnimationEffect::Fade, 'Countdown Fade', 1],
            [AnimationSection::LoveStory, AnimationEffect::SlideLeft, 'Kisah Geser Kiri', 0],
            [AnimationSection::LoveStory, AnimationEffect::Fade, 'Kisah Fade', 1],
            [AnimationSection::Rsvp, AnimationEffect::SlideUp, 'RSVP Geser Naik', 0],
            [AnimationSection::Rsvp, AnimationEffect::Fade, 'RSVP Fade', 1],
            [AnimationSection::Gift, AnimationEffect::Zoom, 'Angpao Zoom', 0],
            [AnimationSection::Gift, AnimationEffect::Fade, 'Angpao Fade', 1],
        ];

        foreach ($defaults as [$section, $effect, $name, $order]) {
            Animation::updateOrCreate(
                ['section' => $section, 'effect' => $effect],
                ['name' => $name, 'is_active' => true, 'sort_order' => $order],
            );
        }

        // One example curtain opener. Admins replace the placeholder asset with
        // a real transparent PNG via the panel; the URL is remote (no local
        // asset_path) so it is never touched by the media-disk cleanup.
        Animation::updateOrCreate(
            ['section' => AnimationSection::Cover, 'effect' => AnimationEffect::CurtainSplit],
            [
                'name' => 'Tirai Merah (contoh)',
                'asset_url' => 'https://placehold.co/600x1200/8b1d1d/ffd27f/png?text=%E2%9D%80',
                'asset_path' => null,
                'is_active' => true,
                'sort_order' => 3,
            ],
        );
    }
}
