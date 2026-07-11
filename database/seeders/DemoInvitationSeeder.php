<?php

namespace Database\Seeders;

use App\Enums\GiftType;
use App\Enums\InvitationStatus;
use App\Enums\Package;
use App\Enums\Timezone;
use App\Models\GalleryPhoto;
use App\Models\GiftAccount;
use App\Models\Invitation;
use App\Models\Template;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoInvitationSeeder extends Seeder
{
    /**
     * Seed one public demo invitation per template, showcased on the landing
     * page. Owned by the superadmin and flagged is_demo so they are excluded
     * from real dashboards/reports.
     */
    public function run(): void
    {
        $owner = User::where('is_admin', true)->orderBy('id')->first()
            ?? User::factory()->admin()->create();

        $couples = [
            'javanese-elegance' => ['Raden', 'Ayu', 'demo-raden-ayu'],
            'sundanese-gold' => ['Dimas', 'Siti', 'demo-dimas-siti'],
            'modern-minimalist' => ['Kevin', 'Clara', 'demo-kevin-clara'],
        ];

        Template::query()->get()->each(function (Template $template) use ($owner, $couples): void {
            $config = $couples[$template->slug] ?? [
                fake()->firstNameMale(),
                fake()->firstNameFemale(),
                'demo-'.$template->slug,
            ];

            [$groom, $bride, $slug] = $config;
            $weddingDate = now()->addMonths(3)->setTime(9, 0);

            $invitation = Invitation::updateOrCreate(
                ['slug' => $slug],
                [
                    'user_id' => $owner->id,
                    'status' => InvitationStatus::Active,
                    'is_demo' => true,
                    'package' => Package::Signature,
                    'active_until' => null,
                    'template_id' => $template->id,
                    'groom_name' => $groom,
                    'bride_name' => $bride,
                    'wedding_date' => $weddingDate,
                    'timezone' => Timezone::WIB,
                    'akad_venue' => 'Masjid Agung',
                    'akad_address' => 'Jl. Merdeka No. 1, Jakarta',
                    'akad_datetime' => $weddingDate,
                    'resepsi_venue' => 'Ballroom Mawar',
                    'resepsi_address' => 'Jl. Melati No. 2, Jakarta',
                    'resepsi_datetime' => $weddingDate->copy()->setTime(19, 0),
                    'maps_url_akad' => 'https://maps.google.com/?q=-6.175,106.827',
                    'maps_url_resepsi' => 'https://maps.google.com/?q=-6.200,106.816',
                    'cover_photo' => "https://placehold.co/1200x1600/E11D48/FFFFFF?text={$groom}+%26+{$bride}",
                    'love_story' => "Kisah cinta {$groom} dan {$bride} bermula dari pertemuan sederhana yang tumbuh menjadi komitmen sehidup semati.",
                    'music_url' => null,
                    'visitor_count' => fake()->numberBetween(80, 400),
                ],
            );

            if ($invitation->galleryPhotos()->count() === 0) {
                foreach (range(1, 4) as $index) {
                    GalleryPhoto::create([
                        'invitation_id' => $invitation->id,
                        'photo_url' => "https://placehold.co/800x800/FBCFE8/9F1239?text=Galeri+{$index}",
                        'sort_order' => $index,
                    ]);
                }
            }

            if ($invitation->giftAccounts()->count() === 0) {
                GiftAccount::create([
                    'invitation_id' => $invitation->id,
                    'type' => GiftType::Bank,
                    'provider_name' => 'BCA',
                    'account_number' => '1234567890',
                    'account_name' => "{$groom} {$bride}",
                    'sort_order' => 0,
                ]);
            }
        });
    }
}
