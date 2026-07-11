<?php

namespace App\Http\Requests;

use App\Enums\Addon;
use App\Enums\Package;
use App\Models\Invitation;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
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
            'package' => ['required', Rule::enum(Package::class)],
            'addons' => ['sometimes', 'array'],
            'addons.*' => [Rule::enum(Addon::class)],
        ];
    }

    /**
     * Ensure the chosen package tier is high enough for the selected template.
     *
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $package = $this->enum('package', Package::class);
                $invitation = $this->route('invitation');
                $template = $invitation instanceof Invitation ? $invitation->template : null;

                if ($package === null || $template === null || $template->isAvailableFor($package)) {
                    return;
                }

                $validator->errors()->add(
                    'package',
                    "Template \"{$template->name}\" membutuhkan paket minimal {$template->min_package->label()}.",
                );
            },
        ];
    }
}
