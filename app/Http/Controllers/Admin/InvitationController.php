<?php

namespace App\Http\Controllers\Admin;

use App\Enums\InvitationStatus;
use App\Http\Controllers\Controller;
use App\Models\Invitation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class InvitationController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $status = $request->enum('status', InvitationStatus::class);

        $invitations = Invitation::query()
            ->with('user:id,name,email')
            ->withCount('rsvps')
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('slug', 'like', "%{$search}%")
                        ->orWhere('groom_name', 'like', "%{$search}%")
                        ->orWhere('bride_name', 'like', "%{$search}%");
                });
            })
            ->when($status, fn ($query) => $query->where('status', $status))
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Invitation $invitation): array => [
                'id' => $invitation->id,
                'slug' => $invitation->slug,
                'couple' => trim("{$invitation->groom_name} & {$invitation->bride_name}", ' &'),
                'user_name' => $invitation->user->name,
                'status' => $invitation->status->value,
                'package' => $invitation->package?->label(),
                'active_until' => $invitation->active_until?->toDateString(),
                'visitor_count' => $invitation->visitor_count,
                'rsvps_count' => $invitation->rsvps_count,
                'created_at' => $invitation->created_at?->toIso8601String(),
            ]);

        return Inertia::render('admin/invitations', [
            'invitations' => $invitations,
            'filters' => [
                'search' => $search,
                'status' => $status?->value,
            ],
        ]);
    }

    /**
     * Override an invitation's status and expiry (comp, extend, or force-expire).
     */
    public function update(Request $request, Invitation $invitation): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::enum(InvitationStatus::class)],
            'active_until' => ['nullable', 'date'],
        ]);

        $invitation->update([
            'status' => $validated['status'],
            'active_until' => $validated['active_until'] ?? null,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Undangan diperbarui.',
        ]);

        return back();
    }
}
