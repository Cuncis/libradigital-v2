<?php

namespace App\Http\Resources;

use App\Models\Animation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Animation
 */
class AnimationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'section' => $this->section->value,
            'section_label' => $this->section->label(),
            'effect' => $this->effect->value,
            'effect_label' => $this->effect->label(),
            'asset_url' => $this->asset_url,
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
        ];
    }
}
