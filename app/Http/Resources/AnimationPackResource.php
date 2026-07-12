<?php

namespace App\Http\Resources;

use App\Models\AnimationPack;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin AnimationPack
 */
class AnimationPackResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'section' => $this->section->value,
            'section_label' => $this->section->label(),
            'thumbnail_url' => $this->thumbnail_url,
            'available_for' => $this->available_for,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'assets_count' => $this->whenCounted('assets'),
            'assets' => AnimationAssetResource::collection($this->whenLoaded('assets')),
        ];
    }
}
