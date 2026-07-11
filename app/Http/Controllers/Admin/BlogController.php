<?php

namespace App\Http\Controllers\Admin;

use App\Enums\BlogCategory;
use App\Enums\BlogStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBlogPostRequest;
use App\Http\Requests\UpdateBlogPostRequest;
use App\Http\Resources\BlogPostResource;
use App\Models\BlogPost;
use Carbon\CarbonInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
    /**
     * List every post (draft + published) for the superadmin.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));

        $posts = BlogPost::query()
            ->with('author')
            ->when($search !== '', fn ($query) => $query->where('title', 'like', "%{$search}%"))
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (BlogPost $post): array => [
                'id' => $post->id,
                'title' => $post->title,
                'slug' => $post->slug,
                'category_label' => $post->category->label(),
                'status' => $post->status->value,
                'status_label' => $post->status->label(),
                'author_name' => $post->author->name,
                'published_at' => $post->published_at?->toIso8601String(),
                'url' => route('blog.show', $post->slug),
            ]);

        return Inertia::render('admin/blog/index', [
            'posts' => $posts,
            'filters' => ['search' => $search],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/blog/form', [
            'post' => null,
            'categories' => BlogCategory::options(),
            'statuses' => BlogStatus::options(),
        ]);
    }

    public function store(StoreBlogPostRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $post = new BlogPost([
            'author_id' => $request->user()->id,
            'title' => $data['title'],
            'slug' => $this->uniqueSlug($data['title']),
            'category' => $data['category'],
            'status' => $data['status'],
            'excerpt' => $data['excerpt'] ?? null,
            'body' => $data['body'],
            'published_at' => $this->resolvePublishedAt($data['status'], null),
        ]);

        $this->applyCover($request, $post);
        $post->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Artikel dibuat.']);

        return to_route('admin.blog.index');
    }

    public function edit(BlogPost $post): Response
    {
        return Inertia::render('admin/blog/form', [
            'post' => BlogPostResource::make($post),
            'categories' => BlogCategory::options(),
            'statuses' => BlogStatus::options(),
        ]);
    }

    public function update(UpdateBlogPostRequest $request, BlogPost $post): RedirectResponse
    {
        $data = $request->validated();

        $post->fill([
            'title' => $data['title'],
            'category' => $data['category'],
            'status' => $data['status'],
            'excerpt' => $data['excerpt'] ?? null,
            'body' => $data['body'],
            'published_at' => $this->resolvePublishedAt(
                BlogStatus::from($data['status']),
                $post->published_at,
            ),
        ]);

        $this->applyCover($request, $post);
        $post->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Artikel diperbarui.']);

        return to_route('admin.blog.index');
    }

    public function destroy(BlogPost $post): RedirectResponse
    {
        if ($post->cover_path !== null) {
            Storage::disk(config('filesystems.media'))->delete($post->cover_path);
        }

        $post->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Artikel dihapus.']);

        return back();
    }

    /**
     * Store an uploaded cover on the media disk, replacing any previous file.
     */
    private function applyCover(Request $request, BlogPost $post): void
    {
        if (! $request->hasFile('cover')) {
            return;
        }

        $disk = config('filesystems.media');

        if ($post->cover_path !== null) {
            Storage::disk($disk)->delete($post->cover_path);
        }

        $path = $request->file('cover')->store('blog/covers', $disk);

        $post->cover_path = $path;
        $post->cover_url = Storage::disk($disk)->url($path);
    }

    /**
     * Stamp published_at when a post first goes live; keep the original stamp
     * on updates, and clear it when moved back to draft.
     */
    private function resolvePublishedAt(BlogStatus|string $status, ?CarbonInterface $current): ?CarbonInterface
    {
        $status = $status instanceof BlogStatus ? $status : BlogStatus::from($status);

        if ($status === BlogStatus::Draft) {
            return null;
        }

        return $current ?? now();
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title);
        $slug = $base;
        $suffix = 2;

        while (BlogPost::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
