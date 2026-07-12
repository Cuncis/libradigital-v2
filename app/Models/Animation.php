<?php

namespace App\Models;

use App\Enums\AnimationEffect;
use App\Enums\AnimationSection;
use Database\Factories\AnimationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Animation extends Model
{
    /** @use HasFactory<AnimationFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'section',
        'effect',
        'asset_path',
        'asset_url',
        'is_active',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'section' => AnimationSection::class,
            'effect' => AnimationEffect::class,
            'is_active' => 'boolean',
        ];
    }
}
