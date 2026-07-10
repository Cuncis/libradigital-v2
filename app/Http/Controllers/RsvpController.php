<?php

namespace App\Http\Controllers;

use App\Concerns\RespondsWithJson;
use App\Enums\Attendance;
use App\Http\Requests\StoreRsvpRequest;
use App\Http\Resources\RsvpResource;
use App\Models\Invitation;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RsvpController extends Controller
{
    use RespondsWithJson;

    /**
     * Store a guest RSVP for an active invitation (public, rate-limited).
     */
    public function store(StoreRsvpRequest $request, string $slug): JsonResponse
    {
        $invitation = $this->visibleOrFail($slug);

        $rsvp = $invitation->rsvps()->create([
            ...$request->validated(),
            'ip_address' => $request->ip(),
        ]);

        return $this->success(
            RsvpResource::make($rsvp),
            'Terima kasih atas ucapan dan konfirmasi kehadiran Anda.',
            201,
        );
    }

    /**
     * List RSVPs for the owner with attendance summary (paginated).
     */
    public function index(Invitation $invitation): Response
    {
        $this->authorize('view', $invitation);

        return Inertia::render('dashboard/rsvps', [
            'invitation' => [
                'id' => $invitation->id,
                'slug' => $invitation->slug,
                'groom_name' => $invitation->groom_name,
                'bride_name' => $invitation->bride_name,
            ],
            'rsvps' => RsvpResource::collection($invitation->rsvps()->latest()->paginate(20)),
            'summary' => $this->summary($invitation),
        ]);
    }

    /**
     * Stream the invitation's RSVPs as a CSV download.
     */
    public function export(Invitation $invitation): StreamedResponse
    {
        $this->authorize('view', $invitation);

        $filename = "rsvp-{$invitation->slug}.csv";

        return response()->streamDownload(function () use ($invitation) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Nama Tamu', 'Kehadiran', 'Ucapan', 'Waktu']);

            $invitation->rsvps()->latest()->chunk(200, function ($rsvps) use ($handle) {
                foreach ($rsvps as $rsvp) {
                    fputcsv($handle, [
                        $rsvp->guest_name,
                        $rsvp->attendance->value,
                        $rsvp->message,
                        $rsvp->created_at?->toDateTimeString(),
                    ]);
                }
            });

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /**
     * @return array{hadir: int, tidak_hadir: int, ragu: int, total: int}
     */
    private function summary(Invitation $invitation): array
    {
        $counts = $invitation->rsvps()
            ->selectRaw('attendance, count(*) as total')
            ->groupBy('attendance')
            ->pluck('total', 'attendance');

        return [
            'hadir' => (int) ($counts[Attendance::Hadir->value] ?? 0),
            'tidak_hadir' => (int) ($counts[Attendance::TidakHadir->value] ?? 0),
            'ragu' => (int) ($counts[Attendance::Ragu->value] ?? 0),
            'total' => (int) $counts->sum(),
        ];
    }

    private function visibleOrFail(string $slug): Invitation
    {
        $invitation = Invitation::query()->where('slug', $slug)->firstOrFail();

        abort_unless($invitation->isPubliclyVisible(), 404);

        return $invitation;
    }
}
