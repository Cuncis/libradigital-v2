<?php

namespace App\Http\Controllers;

use App\Concerns\RespondsWithJson;
use App\Enums\Addon;
use App\Http\Requests\StoreGuestBookEntryRequest;
use App\Http\Resources\GuestBookEntryResource;
use App\Models\Invitation;
use Illuminate\Http\JsonResponse;

class GuestBookController extends Controller
{
    use RespondsWithJson;

    /**
     * Store a guest-book entry for an active invitation that has the guest_book
     * add-on (public, rate-limited).
     */
    public function store(StoreGuestBookEntryRequest $request, string $slug): JsonResponse
    {
        $invitation = Invitation::query()->where('slug', $slug)->firstOrFail();

        abort_unless($invitation->isPubliclyVisible(), 404);
        abort_unless($invitation->hasAddon(Addon::GuestBook), 404);

        $entry = $invitation->guestBookEntries()->create([
            ...$request->validated(),
            'ip_address' => $request->ip(),
        ]);

        return $this->success(
            GuestBookEntryResource::make($entry),
            'Terima kasih atas ucapan Anda.',
            201,
        );
    }
}
