<?php

use App\Models\Template;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Older saved template layouts concatenated the couple names with a
     * spaceless "&" literal (e.g. "Groom&Bride"). The current default uses
     * " & ". Normalize any stored layout so names render with spaces.
     */
    public function up(): void
    {
        Template::query()->whereNotNull('layout')->get()->each(function (Template $template): void {
            $layout = $template->layout;
            $changed = false;

            $walk = function (array &$node) use (&$walk, &$changed): void {
                if (($node['value']['kind'] ?? null) === 'template') {
                    foreach ($node['value']['parts'] as &$part) {
                        if (($part['kind'] ?? null) === 'literal' && trim($part['value']) === '&') {
                            $part['value'] = ' & ';
                            $changed = true;
                        }
                    }
                    unset($part);
                }

                // Iterate by reference only over a real array key: `?? []` would
                // bind the reference to a throwaway copy and drop nested edits.
                if (isset($node['children']) && is_array($node['children'])) {
                    foreach ($node['children'] as &$child) {
                        $walk($child);
                    }
                    unset($child);
                }
            };

            $walk($layout['root']);

            if ($changed) {
                $template->update(['layout' => $layout]);
            }
        });
    }

    public function down(): void
    {
        // Not reversible: restoring the spaceless "&" would reintroduce the bug.
    }
};
