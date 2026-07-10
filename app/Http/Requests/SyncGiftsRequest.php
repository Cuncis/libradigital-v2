<?php

namespace App\Http\Requests;

use App\Enums\GiftType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class SyncGiftsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'gifts' => ['present', 'array'],
            'gifts.*.type' => ['required', new Enum(GiftType::class)],
            'gifts.*.provider_name' => ['required', 'string', 'max:255'],
            'gifts.*.account_number' => ['required', 'string', 'max:255'],
            'gifts.*.account_name' => ['required', 'string', 'max:255'],
            'gifts.*.sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
