<?php

namespace App\Http\Controllers;

use App\Enums\InvitationStatus;
use App\Enums\Package;
use App\Models\BlogPost;
use App\Models\Invitation;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    /**
     * Render the public marketing landing page: package catalog, live demo
     * invitations, and the latest blog articles.
     */
    public function __invoke(): Response
    {
        return Inertia::render('welcome', [
            'packages' => Package::catalog(),
            'demos' => $this->demos(),
            'posts' => $this->latestPosts(),
        ]);
    }

    /**
     * Published demo invitations to showcase, grouped by package tier on the
     * client. Capped at six per tier so each tab stays balanced.
     *
     * @return list<array{slug: string, package: string|null, groom_name: string|null, bride_name: string|null, cover_photo: string|null, template_name: string|null, url: string}>
     */
    private function demos(): array
    {
        return Invitation::query()
            ->where('is_demo', true)
            ->where('status', InvitationStatus::Active)
            ->with('template')
            ->orderBy('id')
            ->get()
            ->groupBy(fn (Invitation $invitation): string => $invitation->package?->value ?? 'other')
            ->flatMap(fn ($group) => $group->take(6))
            ->map(fn (Invitation $invitation): array => [
                'slug' => $invitation->slug,
                'package' => $invitation->package?->value,
                'groom_name' => $invitation->groom_name,
                'bride_name' => $invitation->bride_name,
                'cover_photo' => $invitation->cover_photo,
                'template_name' => $invitation->template?->name,
                'url' => route('invitation.show', $invitation->slug),
            ])
            ->values()
            ->all();
    }

    /**
     * The three most recent published blog posts.
     *
     * @return list<array{title: string, slug: string, category_label: string, cover_url: string|null, excerpt: string|null, published_at: string|null, url: string}>
     */
    private function latestPosts(): array
    {
        return BlogPost::query()
            ->published()
            ->latest('published_at')
            ->take(3)
            ->get()
            ->map(fn (BlogPost $post): array => [
                'title' => $post->title,
                'slug' => $post->slug,
                'category_label' => $post->category->label(),
                'cover_url' => $post->cover_url,
                'excerpt' => $post->excerpt,
                'published_at' => $post->published_at?->toIso8601String(),
                'url' => route('blog.show', $post->slug),
            ])
            ->all();
    }
}
