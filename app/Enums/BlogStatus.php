<?php

namespace App\Enums;

enum BlogStatus: string
{
    case Draft = 'draft';
    case Published = 'published';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draf',
            self::Published => 'Terbit',
        };
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(fn (self $status): array => [
            'value' => $status->value,
            'label' => $status->label(),
        ], self::cases());
    }
}
