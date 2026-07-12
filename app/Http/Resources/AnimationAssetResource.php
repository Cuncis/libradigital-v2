<?php

namespace App\Http\Resources;

use App\Models\AnimationAsset;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin AnimationAsset
 */
class AnimationAssetResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'asset_url' => $this->asset_url,
            'motion_type' => $this->motion_type->value,
            'position_x' => $this->position_x,
            'position_y' => $this->position_y,
            'width_percent' => $this->width_percent,
            'opacity' => $this->opacity,
            'duration_ms' => $this->duration_ms,
            'delay_ms' => $this->delay_ms,
            'repeat_count' => $this->repeat_count,
            'z_index' => $this->z_index,
            'sort_order' => $this->sort_order,
        ];
    }
}
