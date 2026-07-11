<?php

namespace App\Http\Controllers;

use App\Enums\BlogCategory;
use App\Http\Resources\BlogPostResource;
use App\Models\BlogPost;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
    /**
     * Public blog index: published posts, newest first, optional category filter.
     */
    public function index(Request $request): Response
    {
        $category = $request->enum('category', BlogCategory::class);

        $posts = BlogPost::query()
            ->published()
            ->with('author')
            ->when($category, fn ($query) => $query->where('category', $category))
            ->latest('published_at')
            ->paginate(9)
            ->withQueryString()
            ->through(fn (BlogPost $post): array => [
                'id' => $post->id,
                'title' => $post->title,
                'slug' => $post->slug,
                'category' => $post->category->value,
                'category_label' => $post->category->label(),
                'cover_url' => $post->cover_url,
                'excerpt' => $post->excerpt,
                'author_name' => $post->author->name,
                'published_at' => $post->published_at?->toIso8601String(),
                'url' => route('blog.show', $post->slug),
            ]);

        return Inertia::render('blog/index', [
            'posts' => $posts,
            'categories' => BlogCategory::options(),
            'filters' => ['category' => $category?->value],
        ]);
    }

    /**
     * Public single post page. Only published posts are reachable.
     */
    public function show(BlogPost $post): Response
    {
        abort_unless($post->isPublished(), 404);

        $post->load('author');

        $related = BlogPost::query()
            ->published()
            ->where('id', '!=', $post->id)
            ->where('category', $post->category)
            ->latest('published_at')
            ->take(3)
            ->get();

        return Inertia::render('blog/show', [
            'post' => BlogPostResource::make($post),
            'related' => BlogPostResource::collection($related),
        ])->withViewData(['ogMeta' => $this->ogMeta($post)]);
    }

    /**
     * Open Graph meta for rich link previews.
     *
     * @return array{title: string, description: string, image: string|null, url: string}
     */
    private function ogMeta(BlogPost $post): array
    {
        return [
            'title' => $post->title,
            'description' => (string) ($post->excerpt ?? ''),
            'image' => $post->cover_url,
            'url' => route('blog.show', $post->slug),
        ];
    }
}
