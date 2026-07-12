<?php

namespace App\Models;

use App\Enums\AnimationEffect;
use App\Enums\AnimationSection;
use App\Enums\Package;
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
        'min_package',
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
            'min_package' => Package::class,
            'is_active' => 'boolean',
        ];
    }

    /**
     * Whether the given package tier (null = no package yet) may use this
     * animation. A null min_package means every tier qualifies.
     */
    public function isUnlockedFor(?Package $package): bool
    {
        if ($this->min_package === null) {
            return true;
        }

        return $package !== null && $package->includes($this->min_package);
    }
}
