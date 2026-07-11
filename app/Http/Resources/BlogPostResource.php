<?php

namespace App\Http\Resources;

use App\Models\BlogPost;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin BlogPost
 */
class BlogPostResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'category' => $this->category->value,
            'category_label' => $this->category->label(),
            'status' => $this->status->value,
            'cover_url' => $this->cover_url,
            'excerpt' => $this->excerpt,
            'body' => $this->when(
                $request->routeIs('blog.show', 'admin.blog.*'),
                fn (): string => $this->body,
            ),
            'author_name' => $this->whenLoaded('author', fn (): string => $this->author->name),
            'published_at' => $this->published_at?->toIso8601String(),
            'url' => route('blog.show', $this->slug),
        ];
    }
}
