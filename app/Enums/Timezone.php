<?php

namespace App\Enums;

enum Timezone: string
{
    case WIB = 'WIB';
    case WITA = 'WITA';
    case WIT = 'WIT';

    /**
     * The IANA timezone identifier used for date calculations.
     */
    public function identifier(): string
    {
        return match ($this) {
            self::WIB => 'Asia/Jakarta',
            self::WITA => 'Asia/Makassar',
            self::WIT => 'Asia/Jayapura',
        };
    }
}
