<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTemplateLayoutRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return (bool) $this->user()?->is_admin;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'layout' => ['required', 'array'],
            'layout.version' => ['required', 'integer', 'min:1'],
            'layout.root' => ['required', 'array'],
            'layout.root.id' => ['required', 'string'],
            'layout.root.type' => ['required', 'string', 'in:container,section'],
            'layout.root.children' => ['required', 'array'],
            // The cover tree is optional (templates may keep the legacy cover).
            'cover' => ['nullable', 'array'],
            'cover.version' => ['required_with:cover', 'integer', 'min:1'],
            'cover.root' => ['required_with:cover', 'array'],
            'cover.root.id' => ['required_with:cover', 'string'],
            'cover.root.type' => ['required_with:cover', 'string', 'in:container,section'],
            'cover.root.children' => ['required_with:cover', 'array'],
        ];
    }
}
