<?php

namespace App\Notifications;

use App\Models\Invitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InvitationActivated extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Invitation $invitation) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $couple = trim("{$this->invitation->groom_name} & {$this->invitation->bride_name}", ' &');
        $publicUrl = route('invitation.show', $this->invitation->slug);

        $message = (new MailMessage)
            ->subject('Undangan Anda sudah aktif! 🎉')
            ->greeting('Selamat!')
            ->line("Pembayaran untuk paket {$this->invitation->package?->label()} telah kami terima dan undangan {$couple} kini sudah aktif.")
            ->action('Lihat Undangan', $publicUrl);

        if ($this->invitation->active_until !== null) {
            $message->line("Undangan aktif hingga {$this->invitation->active_until->translatedFormat('d F Y')}.");
        }

        return $message
            ->line('Bagikan tautan undangan Anda kepada para tamu dan pantau konfirmasi kehadiran melalui dashboard.')
            ->salutation('Salam hangat, Tim libradigital.id');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'invitation_id' => $this->invitation->id,
        ];
    }
}
