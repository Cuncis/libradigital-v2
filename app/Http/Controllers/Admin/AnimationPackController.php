<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AnimationPackSection;
use App\Enums\MotionType;
use App\Enums\Package;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAnimationPackRequest;
use App\Http\Requests\UpdateAnimationPackRequest;
use App\Http\Resources\AnimationPackResource;
use App\Models\AnimationPack;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AnimationPackController extends Controller
{
    public function index(): Response
    {
        $packs = AnimationPack::query()
            ->withCount('assets')
            ->orderBy('section')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/animation-packs/index', [
            'packs' => AnimationPackResource::collection($packs),
            'sections' => AnimationPackSection::catalog(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/animation-packs/form', [
            'pack' => null,
            ...$this->formCatalogs(),
        ]);
    }

    public function edit(AnimationPack $pack): Response
    {
        $pack->load('assets');

        return Inertia::render('admin/animation-packs/form', [
            'pack' => AnimationPackResource::make($pack),
            ...$this->formCatalogs(),
        ]);
    }

    public function store(StoreAnimationPackRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $pack = DB::transaction(function () use ($request, $data): AnimationPack {
            $pack = AnimationPack::create([
                'name' => $data['name'],
                'slug' => $this->uniqueSlug($data['name']),
                'section' => $data['section'],
                'available_for' => $data['available_for'],
                'is_active' => $request->boolean('is_active', true),
                'created_by' => $request->user()->id,
            ]);

            foreach ($data['assets'] as $index => $asset) {
                $this->createAsset($pack, $asset, $index);
            }

            $this->refreshThumbnail($pack);

            return $pack;
        });

        return redirect()
            ->route('admin.animation-packs.edit', $pack)
            ->with('success', 'Animation pack berhasil dibuat.');
    }

    public function update(UpdateAnimationPackRequest $request, AnimationPack $pack): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($request, $pack, $data): void {
            $pack->fill([
                'name' => $data['name'] ?? $pack->name,
                'section' => $data['section'] ?? $pack->section,
                'available_for' => $data['available_for'] ?? $pack->available_for,
            ]);

            if ($request->has('is_active')) {
                $pack->is_active = $request->boolean('is_active');
            }

            $pack->save();

            // Sync existing assets: update the ones sent, delete the ones dropped.
            $keptIds = collect($data['assets'] ?? [])->pluck('id')->all();

            $pack->assets()->whereNotIn('id', $keptIds)->get()->each(function ($asset): void {
                $this->deleteAssetFile($asset->asset_path);
                $asset->delete();
            });

            foreach ($data['assets'] ?? [] as $index => $asset) {
                $pack->assets()->whereKey($asset['id'])->update([
                    'motion_type' => $asset['motion_type'],
                    'position_x' => $asset['position_x'],
                    'position_y' => $asset['position_y'],
                    'width_percent' => $asset['width_percent'],
                    'opacity' => $asset['opacity'],
                    'duration_ms' => $asset['duration_ms'],
                    'delay_ms' => $asset['delay_ms'],
                    'z_index' => $asset['z_index'],
                    'sort_order' => $index,
                ]);
            }

            $offset = count($data['assets'] ?? []);

            foreach ($data['new_assets'] ?? [] as $index => $asset) {
                $this->createAsset($pack, $asset, $offset + $index);
            }

            $this->refreshThumbnail($pack->fresh('assets'));
        });

        return back()->with('success', 'Animation pack berhasil diperbarui.');
    }

    public function destroy(AnimationPack $pack): RedirectResponse
    {
        $pack->loadMissing('assets');

        foreach ($pack->assets as $asset) {
            $this->deleteAssetFile($asset->asset_path);
        }

        $pack->delete();

        return redirect()
            ->route('admin.animation-packs.index')
            ->with('success', 'Animation pack dihapus.');
    }

    /**
     * @return array{sections: list<array{value: string, label: string}>, motions: list<array{value: string, label: string}>, packages: list<mixed>}
     */
    private function formCatalogs(): array
    {
        return [
            'sections' => AnimationPackSection::catalog(),
            'motions' => MotionType::catalog(),
            'packages' => Package::catalog(),
        ];
    }

    /**
     * @param  array<string, mixed>  $asset
     */
    private function createAsset(AnimationPack $pack, array $asset, int $sortOrder): void
    {
        $disk = config('filesystems.media');
        $path = $asset['file']->store("animation-packs/{$pack->slug}", $disk);

        $pack->assets()->create([
            'asset_path' => $path,
            'asset_url' => Storage::disk($disk)->url($path),
            'motion_type' => $asset['motion_type'],
            'position_x' => $asset['position_x'],
            'position_y' => $asset['position_y'],
            'width_percent' => $asset['width_percent'],
            'opacity' => $asset['opacity'],
            'duration_ms' => $asset['duration_ms'],
            'delay_ms' => $asset['delay_ms'],
            'repeat_count' => -1,
            'z_index' => $asset['z_index'],
            'sort_order' => $sortOrder,
        ]);
    }

    private function deleteAssetFile(?string $path): void
    {
        if ($path !== null) {
            Storage::disk(config('filesystems.media'))->delete($path);
        }
    }

    /**
     * Phase 1 uses the first asset as the pack thumbnail (the drag-drop builder
     * will replace this with an html2canvas capture in Phase 2).
     */
    private function refreshThumbnail(AnimationPack $pack): void
    {
        $pack->update([
            'thumbnail_url' => $pack->assets()->orderBy('sort_order')->value('asset_url'),
        ]);
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'pack';
        $slug = $base;
        $i = 1;

        while (AnimationPack::where('slug', $slug)->exists()) {
            $slug = "{$base}-".++$i;
        }

        return $slug;
    }
}
