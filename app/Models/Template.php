<?php

namespace App\Models;

use App\Enums\Package;
use App\Enums\TemplateCategory;
use Database\Factories\TemplateFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property TemplateCategory $category
 * @property string|null $thumbnail
 * @property bool $is_premium
 * @property Package $min_package
 * @property bool $is_active
 */
class Template extends Model
{
    /** @use HasFactory<TemplateFactory> */
    use HasFactory;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'category' => TemplateCategory::class,
            'is_premium' => 'boolean',
            'min_package' => Package::class,
            'is_active' => 'boolean',
        ];
    }

    /**
     * Whether the given package tier is high enough to use this template.
     */
    public function isAvailableFor(Package $package): bool
    {
        return $package->includes($this->min_package);
    }

    /**
     * @return HasMany<Invitation, $this>
     */
    public function invitations(): HasMany
    {
        return $this->hasMany(Invitation::class);
    }
}
