<?php

namespace App\Http\Requests;

use App\Enums\AnimationEffect;
use App\Enums\AnimationSection;
use App\Enums\Package;
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
     * Treat the "all packages" sentinel (and empty input) as no tier gate.
     */
    protected function prepareForValidation(): void
    {
        if (in_array($this->input('min_package'), ['', 'all'], true)) {
            $this->merge(['min_package' => null]);
        }
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
            'min_package' => ['sometimes', 'nullable', new Enum(Package::class)],
            'asset' => ['nullable', 'image', 'mimes:png,webp,gif', 'max:8192'],
            'is_active' => ['boolean'],
        ];
    }
}
