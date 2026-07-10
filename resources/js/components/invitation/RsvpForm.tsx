import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { ApiError, postJson } from '@/lib/api';
import type { Attendance } from '@/types/invitation';

const OPTIONS: Array<{ value: Attendance; label: string }> = [
    { value: 'hadir', label: 'Hadir' },
    { value: 'tidak_hadir', label: 'Tidak Hadir' },
    { value: 'ragu', label: 'Masih Ragu' },
];

export default function RsvpForm({
    slug,
    defaultName = '',
}: {
    slug: string;
    defaultName?: string;
}) {
    const [guestName, setGuestName] = useState(defaultName);
    const [attendance, setAttendance] = useState<Attendance>('hadir');
    const [message, setMessage] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [done, setDone] = useState(false);
    const [rateLimited, setRateLimited] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        setRateLimited(false);

        try {
            await postJson(`/undangan/${slug}/rsvp`, {
                guest_name: guestName,
                attendance,
                message: message || null,
            });
            setDone(true);
        } catch (error) {
            if (error instanceof ApiError && error.status === 422) {
                setErrors(error.errors);
            } else if (error instanceof ApiError && error.status === 429) {
                setRateLimited(true);
            }
        } finally {
            setProcessing(false);
        }
    };

    if (done) {
        return (
            <div className="rounded-xl border border-rose-200/60 bg-white/70 p-6 text-center dark:border-rose-900/40 dark:bg-neutral-900/60">
                <p className="font-serif text-xl">Terima kasih 🤍</p>
                <p className="mt-2 text-sm text-muted-foreground">
                    Ucapan dan konfirmasi kehadiran Anda telah kami terima.
                </p>
            </div>
        );
    }

    return (
        <form
            onSubmit={submit}
            className="mx-auto grid max-w-md gap-4 rounded-xl border border-rose-200/60 bg-white/70 p-6 dark:border-rose-900/40 dark:bg-neutral-900/60"
        >
            <div className="grid gap-2 text-left">
                <Label htmlFor="guest_name">Nama</Label>
                <Input
                    id="guest_name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Nama Anda"
                    required
                />
                {errors.guest_name && (
                    <p className="text-sm text-destructive">
                        {errors.guest_name[0]}
                    </p>
                )}
            </div>

            <div className="grid gap-2 text-left">
                <Label>Konfirmasi Kehadiran</Label>
                <div className="grid grid-cols-3 gap-2">
                    {OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => setAttendance(option.value)}
                            className={`rounded-md border px-2 py-2 text-sm transition ${
                                attendance === option.value
                                    ? 'border-rose-400 bg-rose-50 font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                                    : 'border-input hover:bg-accent'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-2 text-left">
                <Label htmlFor="message">Ucapan &amp; Doa</Label>
                <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Tuliskan ucapan untuk kedua mempelai"
                />
                {errors.message && (
                    <p className="text-sm text-destructive">
                        {errors.message[0]}
                    </p>
                )}
            </div>

            {rateLimited && (
                <p className="text-sm text-destructive">
                    Terlalu banyak percobaan. Silakan coba lagi sebentar.
                </p>
            )}

            <Button type="submit" disabled={processing}>
                {processing && <Spinner />}
                Kirim
            </Button>
        </form>
    );
}
