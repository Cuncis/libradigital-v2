<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AnimationEffect;
use App\Enums\AnimationSection;
use App\Enums\Package;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAnimationRequest;
use App\Http\Requests\UpdateAnimationRequest;
use App\Http\Resources\AnimationResource;
use App\Models\Animation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class AnimationController extends Controller
{
    public function index(): Response
    {
        $animations = Animation::query()
            ->orderBy('section')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/animations', [
            'animations' => AnimationResource::collection($animations),
            'sections' => AnimationSection::catalog(),
            'effects' => AnimationEffect::catalog(),
            'packages' => Package::catalog(),
        ]);
    }

    public function store(StoreAnimationRequest $request): RedirectResponse
    {
        $animation = new Animation($request->safe()->except('asset', 'is_active'));
        $animation->is_active = $request->boolean('is_active', true);
        $this->storeAsset($request, $animation);
        $animation->save();

        return back();
    }

    public function update(UpdateAnimationRequest $request, Animation $animation): RedirectResponse
    {
        $animation->fill($request->safe()->except('asset', 'is_active'));

        if ($request->has('is_active')) {
            $animation->is_active = $request->boolean('is_active');
        }

        $this->storeAsset($request, $animation);
        $animation->save();

        return back();
    }

    public function destroy(Animation $animation): RedirectResponse
    {
        if ($animation->asset_path !== null) {
            Storage::disk(config('filesystems.media'))->delete($animation->asset_path);
        }

        $animation->delete();

        return back();
    }

    /**
     * Store an uploaded asset on the media disk, replacing any previous file.
     */
    private function storeAsset(StoreAnimationRequest|UpdateAnimationRequest $request, Animation $animation): void
    {
        if (! $request->hasFile('asset')) {
            return;
        }

        $disk = config('filesystems.media');

        if ($animation->asset_path !== null) {
            Storage::disk($disk)->delete($animation->asset_path);
        }

        $path = $request->file('asset')->store('animations', $disk);

        $animation->asset_path = $path;
        $animation->asset_url = Storage::disk($disk)->url($path);
    }
}
