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
use Illuminate\Support\Collection;

class DemoInvitationSeeder extends Seeder
{
    /**
     * The demo couples showcased on the landing page — six per package tier.
     *
     * @var list<array{0: string, 1: string}>
     */
    private array $couples = [
        ['Raden', 'Ayu'], ['Dimas', 'Siti'], ['Kevin', 'Clara'],
        ['Bagus', 'Dewi'], ['Arya', 'Putri'], ['Rizky', 'Maya'],
        ['Fajar', 'Anisa'], ['Yoga', 'Rara'], ['Hendra', 'Lestari'],
        ['Bayu', 'Intan'], ['Galih', 'Sasha'], ['Reza', 'Nabila'],
        ['Andi', 'Melati'], ['Doni', 'Kirana'], ['Iqbal', 'Salsa'],
        ['Wahyu', 'Tiara'], ['Surya', 'Cantika'], ['Aditya', 'Bella'],
        ['Ilham', 'Gita'], ['Rangga', 'Wulan'], ['Panji', 'Sekar'],
        ['Eka', 'Ratna'], ['Teguh', 'Amara'], ['Dwi', 'Zahra'],
    ];

    /**
     * Seed six public demo invitations per package tier (24 total), showcased
     * on the landing page. Owned by the superadmin and flagged is_demo so they
     * are excluded from real dashboards/reports.
     */
    public function run(): void
    {
        $owner = User::where('is_admin', true)->orderBy('id')->first()
            ?? User::factory()->admin()->create();

        $templates = Template::query()->where('is_active', true)->get();

        if ($templates->isEmpty()) {
            $templates = Template::factory()->count(3)->create();
        }

        $keptSlugs = [];
        $couple = 0;

        foreach (Package::cases() as $package) {
            $available = $this->templatesFor($templates, $package);

            for ($index = 1; $index <= 6; $index++) {
                [$groom, $bride] = $this->couples[$couple % count($this->couples)];
                $couple++;

                $slug = "demo-{$package->value}-{$index}";
                $keptSlugs[] = $slug;

                $template = $available[($index - 1) % $available->count()];
                $this->buildDemo($owner->id, $slug, $groom, $bride, $package, $template);
            }
        }

        // Remove any stale demos from previous seed shapes.
        Invitation::query()
            ->where('is_demo', true)
            ->whereNotIn('slug', $keptSlugs)
            ->get()
            ->each(fn (Invitation $invitation) => $invitation->delete());
    }

    /**
     * Templates a package tier can actually use, falling back to all templates
     * when none match (e.g. Starter with only premium templates seeded).
     *
     * @param  Collection<int, Template>  $templates
     * @return Collection<int, Template>
     */
    private function templatesFor(Collection $templates, Package $package): Collection
    {
        $available = $templates->filter(fn (Template $template) => $template->isAvailableFor($package))->values();

        return $available->isNotEmpty() ? $available : $templates->values();
    }

    private function buildDemo(int $ownerId, string $slug, string $groom, string $bride, Package $package, Template $template): void
    {
        $weddingDate = now()->addMonths(3)->setTime(9, 0);

        $invitation = Invitation::updateOrCreate(
            ['slug' => $slug],
            [
                'user_id' => $ownerId,
                'status' => InvitationStatus::Active,
                'is_demo' => true,
                'package' => $package,
                'active_until' => $package->activeUntil(now())?->toDateString(),
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
                'cover_photo' => "https://placehold.co/1200x1600/1b4965/ffbb05?text={$groom}+%26+{$bride}",
                'love_story' => "Kisah cinta {$groom} dan {$bride} bermula dari pertemuan sederhana yang tumbuh menjadi komitmen sehidup semati.",
                'music_url' => null,
                'visitor_count' => fake()->numberBetween(80, 400),
            ],
        );

        if ($invitation->galleryPhotos()->count() === 0) {
            foreach (range(1, 4) as $photo) {
                GalleryPhoto::create([
                    'invitation_id' => $invitation->id,
                    'photo_url' => "https://placehold.co/800x800/1b4965/ffbb05?text=Galeri+{$photo}",
                    'sort_order' => $photo,
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
    }
}
