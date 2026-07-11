<?php

namespace App\Enums;

use Carbon\CarbonInterface;

enum Package: string
{
    case Starter = 'starter';
    case Standard = 'standard';
    case Premium = 'premium';
    case Signature = 'signature';

    public function label(): string
    {
        return match ($this) {
            self::Starter => 'Starter',
            self::Standard => 'Standard',
            self::Premium => 'Premium',
            self::Signature => 'Signature',
        };
    }

    /**
     * Tier ranking used to compare package levels (Starter = 1 … Signature = 4).
     */
    public function rank(): int
    {
        return match ($this) {
            self::Starter => 1,
            self::Standard => 2,
            self::Premium => 3,
            self::Signature => 4,
        };
    }

    /**
     * Whether this package is at least the given minimum tier.
     */
    public function includes(self $minimum): bool
    {
        return $this->rank() >= $minimum->rank();
    }

    /**
     * Price in Rupiah.
     */
    public function price(): int
    {
        return match ($this) {
            self::Starter => 99_000,
            self::Standard => 179_000,
            self::Premium => 299_000,
            self::Signature => 599_000,
        };
    }

    /**
     * How many months the invitation stays active, or null for forever (Signature).
     */
    public function durationMonths(): ?int
    {
        return match ($this) {
            self::Starter => 3,
            self::Standard => 6,
            self::Premium => 12,
            self::Signature => null,
        };
    }

    /**
     * Maximum number of gallery photos the package allows.
     */
    public function galleryLimit(): int
    {
        return match ($this) {
            self::Starter => 0,
            self::Standard => 20,
            self::Premium => 50,
            self::Signature => 100,
        };
    }

    public function allowsLoveStory(): bool
    {
        return $this !== self::Starter;
    }

    public function allowsGift(): bool
    {
        return $this !== self::Starter;
    }

    /**
     * The date an invitation on this package would remain active until, counting
     * from the given moment. Null means it never expires (Signature).
     */
    public function activeUntil(CarbonInterface $from): ?CarbonInterface
    {
        $months = $this->durationMonths();

        if ($months === null) {
            return null;
        }

        return $from->copy()->addMonths($months);
    }

    /**
     * Marketing highlights shown on the pricing cards.
     *
     * @return list<string>
     */
    public function features(): array
    {
        return match ($this) {
            self::Starter => [
                'Template dasar',
                'Foto sampul',
                'RSVP & hitung mundur',
                'Aktif 3 bulan',
            ],
            self::Standard => [
                '10+ pilihan template',
                'Galeri hingga 20 foto',
                'Love story & angpao digital',
                'Aktif 6 bulan',
            ],
            self::Premium => [
                'Semua fitur Standard',
                'Galeri hingga 50 foto',
                'Subdomain kustom',
                'Aktif 12 bulan',
            ],
            self::Signature => [
                'Semua fitur Premium',
                'Galeri hingga 100 foto',
                'Domain kustom sendiri',
                'Aktif selamanya',
            ],
        };
    }

    /**
     * The full package catalog for display (pricing page + builder checkout).
     *
     * @return list<array{value: string, label: string, price: int, duration_months: int|null, gallery_limit: int, features: list<string>}>
     */
    public static function catalog(): array
    {
        return array_map(fn (self $package): array => [
            'value' => $package->value,
            'label' => $package->label(),
            'price' => $package->price(),
            'duration_months' => $package->durationMonths(),
            'gallery_limit' => $package->galleryLimit(),
            'features' => $package->features(),
        ], self::cases());
    }
}
