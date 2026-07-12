<?php

namespace App\Http\Requests;

use App\Enums\AnimationEffect;
use App\Enums\AnimationSection;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateAnimationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'section' => ['sometimes', 'required', new Enum(AnimationSection::class)],
            'effect' => ['sometimes', 'required', new Enum(AnimationEffect::class)],
            'asset' => ['nullable', 'image', 'mimes:png,webp,gif', 'max:8192'],
            'is_active' => ['boolean'],
        ];
    }
}
