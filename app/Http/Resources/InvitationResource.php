<?php

namespace App\Http\Resources;

use App\Enums\Addon;
use App\Models\Invitation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Invitation
 */
class InvitationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'status' => $this->status->value,
            'package' => $this->package?->value,
            'active_until' => $this->active_until?->toDateString(),
            'template_id' => $this->template_id,
            'groom_name' => $this->groom_name,
            'bride_name' => $this->bride_name,
            'wedding_date' => $this->wedding_date?->toIso8601String(),
            'timezone' => $this->timezone->value,
            'akad_venue' => $this->akad_venue,
            'akad_address' => $this->akad_address,
            'akad_datetime' => $this->akad_datetime?->toIso8601String(),
            'resepsi_venue' => $this->resepsi_venue,
            'resepsi_address' => $this->resepsi_address,
            'resepsi_datetime' => $this->resepsi_datetime?->toIso8601String(),
            'maps_url_akad' => $this->maps_url_akad,
            'maps_url_resepsi' => $this->maps_url_resepsi,
            'cover_photo' => $this->cover_photo,
            'love_story' => $this->love_story,
            'music_url' => $this->music_url,
            'visitor_count' => $this->visitor_count,
            'public_url' => route('invitation.show', $this->slug),
            'rsvps_count' => $this->whenCounted('rsvps'),
            'template' => TemplateResource::make($this->whenLoaded('template')),
            'gift_accounts' => GiftAccountResource::collection($this->whenLoaded('giftAccounts')),
            'gallery_photos' => GalleryPhotoResource::collection($this->whenLoaded('galleryPhotos')),
            'has_guest_book' => $this->hasAddon(Addon::GuestBook),
            'guest_book_entries' => GuestBookEntryResource::collection($this->whenLoaded('guestBookEntries')),
        ];
    }
}
