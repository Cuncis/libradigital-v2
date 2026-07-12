<?php

namespace App\Http\Requests;

use App\Enums\AnimationPackSection;
use App\Enums\MotionType;
use App\Enums\Package;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class UpdateAnimationPackRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * `assets` are existing rows (kept/updated by id); rows omitted are deleted.
     * `new_assets` are fresh uploads to append.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $packId = $this->route('pack')?->id;

        return [
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'section' => ['sometimes', 'required', new Enum(AnimationPackSection::class)],
            'available_for' => ['sometimes', 'required', 'array', 'min:1'],
            'available_for.*' => [Rule::enum(Package::class)],
            'is_active' => ['boolean'],
            'thumbnail' => ['nullable', 'image', 'mimes:png,webp,jpeg,jpg', 'max:1024'],

            'assets' => ['sometimes', 'array', 'max:10'],
            'assets.*.id' => [
                'required',
                Rule::exists('animation_assets', 'id')->where('pack_id', $packId),
            ],
            'assets.*.motion_type' => ['required', new Enum(MotionType::class)],
            'assets.*.position_x' => ['required', 'numeric', 'between:0,100'],
            'assets.*.position_y' => ['required', 'numeric', 'between:0,100'],
            'assets.*.width_percent' => ['required', 'numeric', 'between:1,60'],
            'assets.*.opacity' => ['required', 'numeric', 'between:0.05,1'],
            'assets.*.duration_ms' => ['required', 'integer', 'between:300,20000'],
            'assets.*.delay_ms' => ['required', 'integer', 'between:0,10000'],
            'assets.*.z_index' => ['required', 'integer', 'between:0,999'],

            'new_assets' => ['sometimes', 'array', 'max:10'],
            'new_assets.*.file' => ['required', 'image', 'mimes:png,webp', 'max:200'],
            'new_assets.*.motion_type' => ['required', new Enum(MotionType::class)],
            'new_assets.*.position_x' => ['required', 'numeric', 'between:0,100'],
            'new_assets.*.position_y' => ['required', 'numeric', 'between:0,100'],
            'new_assets.*.width_percent' => ['required', 'numeric', 'between:1,60'],
            'new_assets.*.opacity' => ['required', 'numeric', 'between:0.05,1'],
            'new_assets.*.duration_ms' => ['required', 'integer', 'between:300,20000'],
            'new_assets.*.delay_ms' => ['required', 'integer', 'between:0,10000'],
            'new_assets.*.z_index' => ['required', 'integer', 'between:0,999'],
        ];
    }
}
