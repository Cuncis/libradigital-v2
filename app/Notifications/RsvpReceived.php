<?php

namespace App\Notifications;

use App\Enums\Attendance;
use App\Models\Rsvp;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RsvpReceived extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Retry to ride out transient mail-transport failures.
     */
    public int $tries = 3;

    public function __construct(public Rsvp $rsvp) {}

    /**
     * Escalating backoff between attempts (seconds).
     *
     * @return list<int>
     */
    public function backoff(): array
    {
        return [60, 300, 900];
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $attendance = match ($this->rsvp->attendance) {
            Attendance::Hadir => 'akan hadir',
            Attendance::TidakHadir => 'berhalangan hadir',
            Attendance::Ragu => 'masih ragu',
        };

        $rsvpsUrl = route('invitations.rsvps.index', $this->rsvp->invitation_id);

        $message = (new MailMessage)
            ->subject("RSVP baru dari {$this->rsvp->guest_name}")
            ->greeting('Ada konfirmasi kehadiran baru')
            ->line("{$this->rsvp->guest_name} {$attendance} di pernikahan Anda.");

        if (! empty($this->rsvp->message)) {
            $message->line("Ucapan: \"{$this->rsvp->message}\"");
        }

        return $message
            ->action('Lihat Semua RSVP', $rsvpsUrl)
            ->salutation('Salam hangat, Tim libradigital.id');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'rsvp_id' => $this->rsvp->id,
            'guest_name' => $this->rsvp->guest_name,
        ];
    }
}
