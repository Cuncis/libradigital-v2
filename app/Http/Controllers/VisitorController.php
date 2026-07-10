<?php

namespace App\Http\Controllers;

use App\Concerns\RespondsWithJson;
use App\Enums\InvitationStatus;
use App\Models\Invitation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class VisitorController extends Controller
{
    use RespondsWithJson;

    /**
     * Log a visit (deduplicated by ip + session within 24h) and return the count.
     *
     * The counter is incremented atomically. On a driver that supports it this
     * maps to Redis INCR; on the default database cache it uses an atomic SQL
     * UPDATE via Eloquent's increment().
     */
    public function store(Request $request, string $slug): JsonResponse
    {
        $invitation = $this->publishedOrFail($slug);

        $ip = $request->ip();
        // Prefer a stable client-provided visitor id (persisted in localStorage),
        // falling back to the server session id.
        $sessionId = (string) ($request->input('session_id') ?: $request->session()->getId());

        $alreadyVisited = $invitation->visitors()
            ->where('ip_address', $ip)
            ->where('session_id', $sessionId)
            ->where('visited_at', '>=', now()->subDay())
            ->exists();

        if (! $alreadyVisited) {
            $invitation->visitors()->create([
                'ip_address' => $ip,
                'session_id' => $sessionId,
                'visited_at' => now(),
            ]);

            $invitation->increment('visitor_count');
            Cache::forget($this->cacheKey($slug));
        }

        return $this->success(['count' => (int) $invitation->refresh()->visitor_count]);
    }

    /**
     * Return the current visitor count (cached 30s).
     */
    public function count(string $slug): JsonResponse
    {
        $count = Cache::remember($this->cacheKey($slug), 30, function () use ($slug) {
            return (int) $this->publishedOrFail($slug)->visitor_count;
        });

        return $this->success(['count' => $count]);
    }

    private function cacheKey(string $slug): string
    {
        return "invitation:{$slug}:visitors";
    }

    private function publishedOrFail(string $slug): Invitation
    {
        return Invitation::query()
            ->where('slug', $slug)
            ->where('status', InvitationStatus::Published)
            ->firstOrFail();
    }
}
