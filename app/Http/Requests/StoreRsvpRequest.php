<?php

namespace App\Http\Requests;

use App\Enums\Attendance;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreRsvpRequest extends FormRequest
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
            'guest_name' => ['required', 'string', 'max:255'],
            'attendance' => ['required', new Enum(Attendance::class)],
            'message' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
