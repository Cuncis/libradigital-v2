<?php

namespace App\Models;

use App\Enums\AnimationPackSection;
use App\Enums\Package;
use Database\Factories\AnimationPackFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AnimationPack extends Model
{
    /** @use HasFactory<AnimationPackFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'section',
        'thumbnail_url',
        'available_for',
        'is_active',
        'sort_order',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'section' => AnimationPackSection::class,
            'available_for' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * @return HasMany<AnimationAsset, $this>
     */
    public function assets(): HasMany
    {
        return $this->hasMany(AnimationAsset::class, 'pack_id')->orderBy('sort_order');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Whether the given package tier may use this pack.
     */
    public function isAvailableFor(?Package $package): bool
    {
        return $package !== null
            && in_array($package->value, $this->available_for ?? [], true);
    }

    /**
     * Active packs available to the given tier.
     *
     * @param  Builder<AnimationPack>  $query
     * @return Builder<AnimationPack>
     */
    public function scopeAvailableFor(Builder $query, Package $package): Builder
    {
        return $query->where('is_active', true)
            ->whereJsonContains('available_for', $package->value);
    }
}
