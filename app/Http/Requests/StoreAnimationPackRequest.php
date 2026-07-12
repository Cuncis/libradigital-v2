<?php

namespace App\Http\Requests;

use App\Enums\AnimationPackSection;
use App\Enums\MotionType;
use App\Enums\Package;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class StoreAnimationPackRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:100'],
            'section' => ['required', new Enum(AnimationPackSection::class)],
            'available_for' => ['required', 'array', 'min:1'],
            'available_for.*' => [Rule::enum(Package::class)],
            'is_active' => ['boolean'],
            'thumbnail' => ['nullable', 'image', 'mimes:png,webp,jpeg,jpg', 'max:1024'],

            'assets' => ['required', 'array', 'min:1', 'max:10'],
            'assets.*.file' => ['required', 'image', 'mimes:png,webp', 'max:200'],
            'assets.*.motion_type' => ['required', new Enum(MotionType::class)],
            'assets.*.position_x' => ['required', 'numeric', 'between:0,100'],
            'assets.*.position_y' => ['required', 'numeric', 'between:0,100'],
            'assets.*.width_percent' => ['required', 'numeric', 'between:1,60'],
            'assets.*.opacity' => ['required', 'numeric', 'between:0.05,1'],
            'assets.*.duration_ms' => ['required', 'integer', 'between:300,20000'],
            'assets.*.delay_ms' => ['required', 'integer', 'between:0,10000'],
            'assets.*.z_index' => ['required', 'integer', 'between:0,999'],
        ];
    }
}
