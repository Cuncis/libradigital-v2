<?php

namespace App\Http\Requests;

use App\Enums\BlogCategory;
use App\Enums\BlogStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBlogPostRequest extends FormRequest
{
    /**
     * Authorization is enforced by the `admin` middleware on the route group.
     */
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
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', Rule::enum(BlogCategory::class)],
            'status' => ['required', Rule::enum(BlogStatus::class)],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'body' => ['required', 'string'],
            'cover' => ['nullable', 'image', 'max:4096'],
        ];
    }
}
