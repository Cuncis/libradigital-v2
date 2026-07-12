<?php

namespace App\Http\Requests;

use App\Enums\Timezone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class UpdateInvitationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Rules use `sometimes` so the 30-second autosave can send partial payloads.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $invitationId = $this->route('invitation')?->id;

        return [
            'slug' => [
                'sometimes', 'string', 'max:100', 'regex:/^[a-z0-9-]+$/',
                Rule::unique('invitations', 'slug')->ignore($invitationId),
            ],
            'template_id' => ['sometimes', 'nullable', 'integer', 'exists:templates,id'],
            'groom_name' => ['sometimes', 'required', 'string', 'max:255'],
            'bride_name' => ['sometimes', 'required', 'string', 'max:255'],
            'wedding_date' => ['sometimes', 'nullable', 'date'],
            'timezone' => ['sometimes', new Enum(Timezone::class)],
            'akad_venue' => ['sometimes', 'nullable', 'string', 'max:255'],
            'akad_address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'akad_datetime' => ['sometimes', 'nullable', 'date'],
            'resepsi_venue' => ['sometimes', 'nullable', 'string', 'max:255'],
            'resepsi_address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'resepsi_datetime' => ['sometimes', 'nullable', 'date'],
            'maps_url_akad' => ['sometimes', 'nullable', 'url', 'max:1000'],
            'maps_url_resepsi' => ['sometimes', 'nullable', 'url', 'max:1000'],
            'cover_photo' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'love_story' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'music_url' => ['sometimes', 'nullable', 'url', 'max:1000'],

            // Per-section animation choices: { section: animation_id|null }.
            'animations' => ['sometimes', 'array'],
            'animations.*' => ['nullable', 'integer', 'exists:animations,id'],
        ];
    }
}
