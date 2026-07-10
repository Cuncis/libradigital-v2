<?php

namespace App\Services;

use App\Models\Invitation;
use Illuminate\Support\Str;

class SlugService
{
    /**
     * Generate a unique, URL-safe slug from the couple's names.
     *
     * Only letters, numbers and dashes; capped at 100 characters. When the
     * slug is already taken, a numeric suffix (-2, -3, ...) is appended.
     */
    public function generate(string $groom, string $bride, ?int $ignoreId = null): string
    {
        $base = Str::slug($groom.'-'.$bride);

        if ($base === '') {
            $base = 'undangan';
        }

        $base = Str::limit($base, 90, '');
        $slug = $base;
        $i = 2;

        while ($this->exists($slug, $ignoreId)) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }

    /**
     * Determine whether a slug is already used by another invitation.
     */
    private function exists(string $slug, ?int $ignoreId): bool
    {
        return Invitation::query()
            ->where('slug', $slug)
            ->when($ignoreId !== null, fn ($query) => $query->whereKeyNot($ignoreId))
            ->exists();
    }
}
