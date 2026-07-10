<?php

namespace App\Http\Resources;

use App\Models\GiftAccount;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin GiftAccount
 */
class GiftAccountResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'provider_name' => $this->provider_name,
            'account_number' => $this->account_number,
            'account_name' => $this->account_name,
            'sort_order' => $this->sort_order,
        ];
    }
}
