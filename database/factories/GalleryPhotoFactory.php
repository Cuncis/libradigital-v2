<?php

namespace Database\Factories;

use App\Models\GalleryPhoto;
use App\Models\Invitation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GalleryPhoto>
 */
class GalleryPhotoFactory extends Factory
{
    public function definition(): array
    {
        return [
            'invitation_id' => Invitation::factory(),
            'photo_url' => 'https://placehold.co/800x800',
            'sort_order' => 0,
        ];
    }
}
