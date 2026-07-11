<?php

namespace App\Http\Controllers;

use App\Enums\Addon;
use App\Enums\InvitationStatus;
use App\Enums\Package;
use App\Http\Requests\StoreInvitationRequest;
use App\Http\Requests\SyncGiftsRequest;
use App\Http\Requests\UpdateInvitationRequest;
use App\Http\Requests\UploadPhotosRequest;
use App\Http\Resources\InvitationResource;
use App\Http\Resources\TemplateResource;
use App\Jobs\OptimizeImage;
use App\Models\GalleryPhoto;
use App\Models\Invitation;
use App\Models\Template;
use App\Services\SlugService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class InvitationController extends Controller
{
    public function __construct(private SlugService $slugService) {}

    /**
     * Create a new draft invitation and send the owner to the builder.
     */
    public function store(StoreInvitationRequest $request): RedirectResponse
    {
        $invitation = $request->user()->invitations()->create([
            'groom_name' => $request->string('groom_name'),
            'bride_name' => $request->string('bride_name'),
            'slug' => $this->slugService->generate(
                $request->string('groom_name')->toString(),
                $request->string('bride_name')->toString(),
            ),
            'status' => InvitationStatus::Draft,
        ]);

        return redirect()->route('invitations.edit', $invitation);
    }

    /**
     * Render the multi-step builder for an invitation the user owns.
     */
    public function edit(Invitation $invitation): Response
    {
        $this->authorize('update', $invitation);

        $invitation->load(['template', 'giftAccounts', 'galleryPhotos']);

        return Inertia::render('dashboard/builder', [
            'invitation' => InvitationResource::make($invitation),
            'templates' => TemplateResource::collection(
                Template::query()->where('is_active', true)->get()
            ),
            'packages' => Package::catalog(),
            'addons' => Addon::catalog(),
            'midtrans' => [
                'client_key' => config('services.midtrans.client_key'),
                'is_production' => (bool) config('services.midtrans.is_production'),
            ],
        ]);
    }

    /**
     * Update invitation fields (also serves the 30-second autosave).
     */
    public function update(UpdateInvitationRequest $request, Invitation $invitation): RedirectResponse
    {
        $this->authorize('update', $invitation);

        $data = $request->validated();

        // The slug may only change while the invitation is a draft.
        if (! $invitation->isDraft()) {
            unset($data['slug']);
        }

        $invitation->update($data);

        return back();
    }

    /**
     * Upload gallery photos to the configured media disk.
     */
    public function uploadPhotos(UploadPhotosRequest $request, Invitation $invitation): RedirectResponse
    {
        $this->authorize('update', $invitation);

        $disk = config('filesystems.media');
        $nextOrder = (int) $invitation->galleryPhotos()->max('sort_order');

        foreach ($request->file('photos') as $photo) {
            $path = $photo->store("invitations/{$invitation->id}/gallery", $disk);

            $galleryPhoto = $invitation->galleryPhotos()->create([
                'photo_url' => Storage::disk($disk)->url($path),
                'path' => $path,
                'sort_order' => ++$nextOrder,
            ]);

            OptimizeImage::dispatch($galleryPhoto, 'path', 'photo_url');
        }

        return back();
    }

    /**
     * Upload (or replace) the cover photo.
     */
    public function uploadCover(Request $request, Invitation $invitation): RedirectResponse
    {
        $this->authorize('update', $invitation);

        $request->validate([
            'cover' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:8192'],
        ]);

        $disk = config('filesystems.media');
        $path = $request->file('cover')->store("invitations/{$invitation->id}/cover", $disk);

        $invitation->update([
            'cover_photo' => Storage::disk($disk)->url($path),
            'cover_path' => $path,
        ]);

        OptimizeImage::dispatch($invitation, 'cover_path', 'cover_photo');

        return back();
    }

    /**
     * Delete a gallery photo owned by this invitation.
     */
    public function deletePhoto(Invitation $invitation, GalleryPhoto $photo): RedirectResponse
    {
        $this->authorize('update', $invitation);

        abort_unless($photo->invitation_id === $invitation->id, 404);

        if ($photo->path !== null) {
            Storage::disk(config('filesystems.media'))->delete($photo->path);
        }

        $photo->delete();

        return back();
    }

    /**
     * Replace the invitation's gift accounts with the provided array.
     */
    public function syncGifts(SyncGiftsRequest $request, Invitation $invitation): RedirectResponse
    {
        $this->authorize('update', $invitation);

        $invitation->giftAccounts()->delete();

        foreach ($request->validated('gifts') as $index => $gift) {
            $invitation->giftAccounts()->create([
                'type' => $gift['type'],
                'provider_name' => $gift['provider_name'],
                'account_number' => $gift['account_number'],
                'account_name' => $gift['account_name'],
                'sort_order' => $gift['sort_order'] ?? $index,
            ]);
        }

        return back();
    }
}
