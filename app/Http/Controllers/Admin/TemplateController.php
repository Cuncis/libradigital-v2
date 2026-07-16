<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateTemplateLayoutRequest;
use App\Http\Resources\TemplateResource;
use App\Models\Template;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class TemplateController extends Controller
{
    public function index(): Response
    {
        $templates = Template::query()
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/templates/index', [
            'templates' => TemplateResource::collection($templates),
        ]);
    }

    /**
     * Open the visual layout builder for a template. Templates without a layout
     * start from the "Classic" tree so the superadmin always has a base to edit.
     */
    public function builder(Template $template): Response
    {
        if ($template->layout === null) {
            $template->layout = Template::defaultLayout();
        }

        if ($template->cover === null) {
            $template->cover = Template::defaultCover();
        }

        return Inertia::render('admin/templates/builder', [
            'template' => TemplateResource::make($template),
            'sampleInvitation' => $this->sampleInvitation(),
        ]);
    }

    /**
     * Render the template through the real public invitation page using a
     * representative sample invitation, so the admin can see how it looks
     * (cover + body) exactly as a guest would.
     */
    public function preview(Template $template): Response
    {
        $invitation = $this->sampleInvitation();
        $invitation['slug'] = "preview-{$template->id}";
        $invitation['template_id'] = $template->id;
        $invitation['layout'] = $template->resolvedLayout();
        $invitation['cover'] = $template->cover;
        $invitation['template'] = [
            'id' => $template->id,
            'name' => $template->name,
            'slug' => $template->slug,
            'category' => $template->category->value,
            'thumbnail' => $template->thumbnail,
            'is_premium' => $template->is_premium,
            'min_package' => $template->min_package->value,
        ];

        return Inertia::render('invitation/PublicInvitationPage', [
            'invitation' => $invitation,
        ]);
    }

    public function update(UpdateTemplateLayoutRequest $request, Template $template): RedirectResponse
    {
        // Persist the full layout tree, not `validated('layout')`: validated()
        // returns only keys that have explicit rules, which would strip node
        // fields like `style` and container `layout` and corrupt the tree.
        // The UpdateTemplateLayoutRequest has already validated the shape.
        $layout = $request->input('layout');

        $template->update([
            'layout' => $layout,
            'cover' => $request->input('cover'),
            'builder_version' => $layout['version'] ?? 1,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Layout template berhasil disimpan.']);

        return back();
    }

    /**
     * Reset a template back to its defaults by clearing the custom layout and
     * cover, so it falls back to the Classic body tree and the legacy cover.
     */
    public function reset(Template $template): RedirectResponse
    {
        $template->update([
            'layout' => null,
            'cover' => null,
            'builder_version' => 1,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Template dikembalikan ke bawaan.']);

        return back();
    }

    /**
     * Upload a builder asset (cover image or Lottie animation) and return its
     * public URL, which the admin then binds to an image/lottie node's source.
     */
    public function uploadAsset(Request $request, Template $template): JsonResponse
    {
        $request->validate([
            // Raster/vector images and Lottie JSON. `.lottie` (zip) is allowed by
            // extension since its MIME is inconsistent across browsers.
            'asset' => ['required', 'file', 'max:8192', 'mimes:jpg,jpeg,png,webp,svg,gif,json,lottie'],
        ]);

        $disk = config('filesystems.media');
        $path = $request->file('asset')->store("templates/{$template->id}/assets", $disk);

        return response()->json(['url' => Storage::disk($disk)->url($path)]);
    }

    /**
     * A representative invitation payload used to render the builder preview,
     * shaped like the PublicInvitation resource. Static fixture - no DB access.
     *
     * @return array<string, mixed>
     */
    private function sampleInvitation(): array
    {
        $date = now()->addMonths(3)->setTime(9, 0)->toIso8601String();

        return [
            'id' => 0,
            'slug' => 'preview',
            'status' => 'active',
            'package' => 'signature',
            'active_until' => null,
            'template_id' => 0,
            'groom_name' => 'Budi',
            'bride_name' => 'Siti',
            'wedding_date' => $date,
            'timezone' => 'WIB',
            'akad_venue' => 'Masjid Agung',
            'akad_address' => 'Jl. Merdeka No. 1, Jakarta',
            'akad_datetime' => $date,
            'resepsi_venue' => 'Balai Kartini',
            'resepsi_address' => 'Jl. Gatot Subroto No. 37, Jakarta',
            'resepsi_datetime' => $date,
            'maps_url_akad' => 'https://maps.google.com',
            'maps_url_resepsi' => 'https://maps.google.com',
            'cover_photo' => 'https://placehold.co/1200x1600/8B6F47/FFFFFF?text=Cover',
            'love_story' => 'Kami bertemu saat kuliah dan memutuskan untuk melangkah bersama.',
            'music_url' => null,
            'visitor_count' => 128,
            'public_url' => '#',
            'template' => null,
            'gift_accounts' => [
                ['id' => 1, 'type' => 'bank', 'provider_name' => 'BCA', 'account_number' => '1234567890', 'account_name' => 'Budi Santoso', 'sort_order' => 0],
                ['id' => 2, 'type' => 'ewallet', 'provider_name' => 'GoPay', 'account_number' => '081234567890', 'account_name' => 'Siti Aminah', 'sort_order' => 1],
            ],
            'gallery_photos' => [
                ['id' => 1, 'photo_url' => 'https://placehold.co/600x600?text=1', 'sort_order' => 0],
                ['id' => 2, 'photo_url' => 'https://placehold.co/600x600?text=2', 'sort_order' => 1],
                ['id' => 3, 'photo_url' => 'https://placehold.co/600x600?text=3', 'sort_order' => 2],
            ],
            'has_guest_book' => true,
            'guest_book_entries' => [
                ['id' => 1, 'name' => 'Dewi', 'message' => 'Selamat menempuh hidup baru!', 'created_at' => null],
            ],
            'animation_pack_slug' => null,
        ];
    }
}
