<?php

namespace App\Enums;

enum Addon: string
{
    case ExtraGallery = 'extra_gallery';
    case CustomDomain = 'custom_domain';
    case RsvpReminder = 'rsvp_reminder';
    case GuestBook = 'guest_book';

    public function label(): string
    {
        return match ($this) {
            self::ExtraGallery => 'Galeri Ekstra',
            self::CustomDomain => 'Domain Kustom',
            self::RsvpReminder => 'Pengingat RSVP',
            self::GuestBook => 'Buku Tamu Digital',
        };
    }

    /**
     * Price in Rupiah.
     */
    public function price(): int
    {
        return match ($this) {
            self::ExtraGallery => 49_000,
            self::CustomDomain => 99_000,
            self::RsvpReminder => 39_000,
            self::GuestBook => 29_000,
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::ExtraGallery => 'Tambah 50 slot foto galeri.',
            self::CustomDomain => 'Gunakan nama domain Anda sendiri.',
            self::RsvpReminder => 'Kirim pengingat otomatis ke tamu.',
            self::GuestBook => 'Halaman ucapan & doa dari tamu.',
        };
    }

    /**
     * The full add-on catalog for display (builder checkout).
     *
     * @return list<array{value: string, label: string, price: int, description: string}>
     */
    public static function catalog(): array
    {
        return array_map(fn (self $addon): array => [
            'value' => $addon->value,
            'label' => $addon->label(),
            'price' => $addon->price(),
            'description' => $addon->description(),
        ], self::cases());
    }
}
