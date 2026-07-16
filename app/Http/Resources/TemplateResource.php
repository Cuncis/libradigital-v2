<?php

namespace App\Http\Resources;

use App\Models\Template;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Template
 */
class TemplateResource extends JsonResource
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
            'category' => $this->category->value,
            'thumbnail' => $this->thumbnail,
            'is_premium' => $this->is_premium,
            'min_package' => $this->min_package->value,
            'layout' => $this->layout,
            'cover' => $this->cover,
            'builder_version' => $this->builder_version,
            'has_custom_layout' => $this->layout !== null,
            'has_custom_cover' => $this->cover !== null,
        ];
    }
}
