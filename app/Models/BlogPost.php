<?php

namespace App\Models;

use App\Enums\BlogCategory;
use App\Enums\BlogStatus;
use Database\Factories\BlogPostFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $author_id
 * @property string $title
 * @property string $slug
 * @property BlogCategory $category
 * @property BlogStatus $status
 * @property string|null $cover_path
 * @property string|null $cover_url
 * @property string|null $excerpt
 * @property string $body
 * @property Carbon|null $published_at
 * @property-read User $author
 */
class BlogPost extends Model
{
    /** @use HasFactory<BlogPostFactory> */
    use HasFactory;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'category' => BlogCategory::class,
            'status' => BlogStatus::class,
            'published_at' => 'datetime',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function isPublished(): bool
    {
        return $this->status === BlogStatus::Published
            && $this->published_at !== null
            && $this->published_at->lte(now());
    }

    /**
     * Scope to posts that are publicly visible: published and past their
     * publish date.
     *
     * @param  Builder<BlogPost>  $query
     */
    public function scopePublished(Builder $query): void
    {
        $query->where('status', BlogStatus::Published)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
