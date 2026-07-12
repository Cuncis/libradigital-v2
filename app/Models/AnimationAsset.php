<?php

namespace App\Models;

use App\Enums\MotionType;
use Database\Factories\AnimationAssetFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnimationAsset extends Model
{
    /** @use HasFactory<AnimationAssetFactory> */
    use HasFactory;

    protected $fillable = [
        'pack_id',
        'asset_path',
        'asset_url',
        'motion_type',
        'position_x',
        'position_y',
        'width_percent',
        'opacity',
        'duration_ms',
        'delay_ms',
        'repeat_count',
        'z_index',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'motion_type' => MotionType::class,
            'position_x' => 'float',
            'position_y' => 'float',
            'width_percent' => 'float',
            'opacity' => 'float',
            'duration_ms' => 'integer',
            'delay_ms' => 'integer',
            'repeat_count' => 'integer',
            'z_index' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<AnimationPack, $this>
     */
    public function pack(): BelongsTo
    {
        return $this->belongsTo(AnimationPack::class, 'pack_id');
    }
}
