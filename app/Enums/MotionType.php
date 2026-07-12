<?php

namespace App\Enums;

enum MotionType: string
{
    case FloatY = 'float-y';
    case FloatX = 'float-x';
    case FallDown = 'fall-down';
    case FallUp = 'fall-up';
    case Sway = 'sway';
    case Breathe = 'breathe';
    case Spin = 'spin';
    case SpinSlow = 'spin-slow';
    case Drift = 'drift';
    case Twinkle = 'twinkle';

    public function label(): string
    {
        return match ($this) {
            self::FloatY => 'Float Y (naik-turun)',
            self::FloatX => 'Float X (kiri-kanan)',
            self::FallDown => 'Fall Down (jatuh)',
            self::FallUp => 'Fall Up (naik)',
            self::Sway => 'Sway (bergoyang)',
            self::Breathe => 'Breathe (pulse)',
            self::Spin => 'Spin (putar)',
            self::SpinSlow => 'Spin Slow (putar lambat)',
            self::Drift => 'Drift (melayang acak)',
            self::Twinkle => 'Twinkle (kedip)',
        };
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function catalog(): array
    {
        return array_map(
            fn (self $motion): array => [
                'value' => $motion->value,
                'label' => $motion->label(),
            ],
            self::cases(),
        );
    }
}
