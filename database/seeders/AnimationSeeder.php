<?php

namespace Database\Seeders;

use App\Enums\AnimationEffect;
use App\Enums\AnimationSection;
use App\Enums\Package;
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
        // [section, effect, name, sort_order, min_package] — null tier = all packages.
        $defaults = [
            // Cover openers.
            [AnimationSection::Cover, AnimationEffect::CoverFade, 'Cover Memudar', 0, null],
            [AnimationSection::Cover, AnimationEffect::CoverSlideUp, 'Cover Geser ke Atas', 1, null],
            [AnimationSection::Cover, AnimationEffect::CoverZoom, 'Cover Zoom', 2, Package::Premium],

            // Section reveals reused across the remaining sections.
            [AnimationSection::Header, AnimationEffect::Fade, 'Header Fade', 0, null],
            [AnimationSection::Header, AnimationEffect::Zoom, 'Header Zoom', 1, Package::Standard],
            [AnimationSection::Countdown, AnimationEffect::SlideUp, 'Countdown Geser Naik', 0, null],
            [AnimationSection::Countdown, AnimationEffect::Fade, 'Countdown Fade', 1, null],
            [AnimationSection::LoveStory, AnimationEffect::SlideLeft, 'Kisah Geser Kiri', 0, null],
            [AnimationSection::LoveStory, AnimationEffect::Fade, 'Kisah Fade', 1, null],
            [AnimationSection::Rsvp, AnimationEffect::SlideUp, 'RSVP Geser Naik', 0, null],
            [AnimationSection::Rsvp, AnimationEffect::Fade, 'RSVP Fade', 1, null],
            [AnimationSection::Gift, AnimationEffect::Zoom, 'Angpao Zoom', 0, Package::Standard],
            [AnimationSection::Gift, AnimationEffect::Fade, 'Angpao Fade', 1, null],
        ];

        foreach ($defaults as [$section, $effect, $name, $order, $minPackage]) {
            Animation::updateOrCreate(
                ['section' => $section, 'effect' => $effect],
                [
                    'name' => $name,
                    'min_package' => $minPackage,
                    'is_active' => true,
                    'sort_order' => $order,
                ],
            );
        }

        // One example curtain opener, gated to Signature. Admins replace the
        // placeholder asset with a real transparent PNG via the panel; the URL
        // is remote (no local asset_path) so media-disk cleanup never touches it.
        Animation::updateOrCreate(
            ['section' => AnimationSection::Cover, 'effect' => AnimationEffect::CurtainSplit],
            [
                'name' => 'Tirai Merah (contoh)',
                'min_package' => Package::Signature,
                'asset_url' => 'https://placehold.co/600x1200/8b1d1d/ffd27f/png?text=%E2%9D%80',
                'asset_path' => null,
                'is_active' => true,
                'sort_order' => 3,
            ],
        );
    }
}
