<?php

namespace App\Http\Controllers;

use App\Enums\Addon;
use App\Http\Resources\InvitationResource;
use App\Models\Invitation;
use Inertia\Inertia;
use Inertia\Response;

class PublicInvitationController extends Controller
{
    /**
     * Render an active invitation by slug.
     *
     * Open Graph / Twitter meta tags are emitted server-side (via withViewData)
     * so link crawlers such as WhatsApp — which do not execute JavaScript —
     * produce a rich preview. The React page receives the invitation as a prop.
     */
    public function show(string $slug): Response
    {
        $invitation = Invitation::query()
            ->where('slug', $slug)
            ->with(['template', 'giftAccounts', 'galleryPhotos'])
            ->firstOrFail();

        abort_unless($invitation->isPubliclyVisible(), 404);

        // Only display up to the gallery allowance the invitation actually paid
        // for (package tier + extra_gallery add-on).
        $invitation->setRelation(
            'galleryPhotos',
            $invitation->galleryPhotos->take($invitation->galleryLimit()),
        );

        if ($invitation->hasAddon(Addon::GuestBook)) {
            $invitation->load('guestBookEntries');
        }

        return Inertia::render('invitation/PublicInvitationPage', [
            'invitation' => InvitationResource::make($invitation),
        ])->withViewData(['ogMeta' => $this->ogMeta($invitation)]);
    }

    /**
     * Build the Open Graph meta payload for the root Blade template.
     *
     * @return array{title: string, description: string, image: string|null, url: string}
     */
    private function ogMeta(Invitation $invitation): array
    {
        $couple = trim("{$invitation->groom_name} & {$invitation->bride_name}", ' &');

        $date = $invitation->wedding_date
            ? $invitation->wedding_date->locale('id')->translatedFormat('d F Y')
            : 'hari bahagia kami';

        return [
            'title' => "Undangan Pernikahan {$couple}",
            'description' => "Kami mengundang Anda untuk hadir di pernikahan kami pada {$date}",
            'image' => $invitation->cover_photo,
            'url' => route('invitation.show', $invitation->slug),
        ];
    }
}
