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
}
