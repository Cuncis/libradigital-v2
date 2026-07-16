<?php

namespace Database\Seeders;

use App\Enums\AnimationPackSection;
use App\Enums\MotionType;
use App\Enums\Package;
use App\Models\AnimationPack;
use Illuminate\Database\Seeder;

class AnimationPackSeeder extends Seeder
{
    /**
     * Seed a few example floating-overlay packs. Assets use remote placeholder
     * PNGs (no local asset_path) so media-disk cleanup never touches them -
     * admins replace them with real transparent PNGs via the panel.
     */
    public function run(): void
    {
        $flower = fn (string $color, string $glyph): string => "https://placehold.co/200x200/{$color}/ffffff/png?text={$glyph}";

        $packs = [
            [
                'name' => 'Pink Cherry Blossom',
                'slug' => 'pink-cherry-blossom',
                'section' => AnimationPackSection::Hero,
                'available_for' => [Package::Standard->value, Package::Premium->value, Package::Signature->value],
                'sort_order' => 1,
                'assets' => [
                    ['url' => $flower('ffb6c1', '%E2%9D%80'), 'motion' => MotionType::FallDown, 'x' => 15, 'y' => 0, 'w' => 12, 'op' => 0.9, 'dur' => 4000, 'delay' => 0],
                    ['url' => $flower('ffc0cb', '%E2%9D%80'), 'motion' => MotionType::FallDown, 'x' => 45, 'y' => 0, 'w' => 8, 'op' => 0.85, 'dur' => 3000, 'delay' => 800],
                    ['url' => $flower('ffd9e0', '%E2%9C%BF'), 'motion' => MotionType::Drift, 'x' => 75, 'y' => 10, 'w' => 6, 'op' => 0.8, 'dur' => 5000, 'delay' => 1500],
                    ['url' => $flower('ffffff', '%E2%9C%A6'), 'motion' => MotionType::Twinkle, 'x' => 30, 'y' => 20, 'w' => 4, 'op' => 0.9, 'dur' => 1500, 'delay' => 200],
                ],
            ],
            [
                'name' => 'Gold Glitter Rain',
                'slug' => 'gold-glitter-rain',
                'section' => AnimationPackSection::Hero,
                'available_for' => [Package::Premium->value, Package::Signature->value],
                'sort_order' => 2,
                'assets' => [
                    ['url' => $flower('ffd700', '%E2%9C%A6'), 'motion' => MotionType::FallDown, 'x' => 20, 'y' => 0, 'w' => 6, 'op' => 0.7, 'dur' => 3500, 'delay' => 0],
                    ['url' => $flower('ffdf6b', '%E2%9C%A6'), 'motion' => MotionType::FallDown, 'x' => 55, 'y' => 0, 'w' => 4, 'op' => 0.5, 'dur' => 2500, 'delay' => 500],
                    ['url' => $flower('fff3b0', '%E2%97%8B'), 'motion' => MotionType::Breathe, 'x' => 70, 'y' => 40, 'w' => 10, 'op' => 0.3, 'dur' => 2000, 'delay' => 0],
                    ['url' => $flower('ffffff', '%E2%98%85'), 'motion' => MotionType::Twinkle, 'x' => 40, 'y' => 25, 'w' => 4, 'op' => 0.9, 'dur' => 1000, 'delay' => 300],
                ],
            ],
            [
                'name' => 'White Petal Drift',
                'slug' => 'white-petal-drift',
                'section' => AnimationPackSection::Gallery,
                'available_for' => [Package::Standard->value, Package::Premium->value, Package::Signature->value],
                'sort_order' => 3,
                'assets' => [
                    ['url' => $flower('ffffff', '%E2%9D%80'), 'motion' => MotionType::FallDown, 'x' => 25, 'y' => 0, 'w' => 8, 'op' => 0.75, 'dur' => 5000, 'delay' => 0],
                    ['url' => $flower('f5f5f5', '%E2%9C%BF'), 'motion' => MotionType::Drift, 'x' => 60, 'y' => 10, 'w' => 6, 'op' => 0.7, 'dur' => 6000, 'delay' => 1200],
                ],
            ],
        ];

        foreach ($packs as $data) {
            $assets = $data['assets'];
            unset($data['assets']);

            $pack = AnimationPack::updateOrCreate(
                ['slug' => $data['slug']],
                [...$data, 'is_active' => true, 'thumbnail_url' => $assets[0]['url']],
            );

            if ($pack->assets()->count() === 0) {
                foreach ($assets as $order => $asset) {
                    $pack->assets()->create([
                        'asset_path' => null,
                        'asset_url' => $asset['url'],
                        'motion_type' => $asset['motion'],
                        'position_x' => $asset['x'],
                        'position_y' => $asset['y'],
                        'width_percent' => $asset['w'],
                        'opacity' => $asset['op'],
                        'duration_ms' => $asset['dur'],
                        'delay_ms' => $asset['delay'],
                        'repeat_count' => -1,
                        'z_index' => 10,
                        'sort_order' => $order,
                    ]);
                }
            }
        }
    }
}
