import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { ApiError, postJson } from '@/lib/api';
import type { GuestBookEntry } from '@/types/invitation';

interface StoredEntry {
    data: GuestBookEntry;
}

export default function GuestBook({
    slug,
    initialEntries,
}: {
    slug: string;
    initialEntries: GuestBookEntry[];
}) {
    const [entries, setEntries] = useState<GuestBookEntry[]>(initialEntries);
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [rateLimited, setRateLimited] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        setRateLimited(false);

        try {
            const response = await postJson<StoredEntry['data']>(
                `/undangan/${slug}/guestbook`,
                { name, message },
            );
            setEntries((current) => [response.data, ...current]);
            setName('');
            setMessage('');
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

    return (
        <div className="mx-auto grid max-w-md gap-6">
            <form
                onSubmit={submit}
                className="grid gap-4 rounded-xl border border-[var(--inv-card-border)] bg-[var(--inv-card-bg)] p-6"
            >
                <div className="grid gap-2 text-left">
                    <Label htmlFor="gb_name">Nama</Label>
                    <Input
                        id="gb_name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nama Anda"
                        required
                    />
                    {errors.name && (
                        <p className="text-sm text-destructive">
                            {errors.name[0]}
                        </p>
                    )}
                </div>

                <div className="grid gap-2 text-left">
                    <Label htmlFor="gb_message">Ucapan &amp; Doa</Label>
                    <textarea
                        id="gb_message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Tuliskan ucapan untuk kedua mempelai"
                        required
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
                    Kirim Ucapan
                </Button>
            </form>

            {entries.length > 0 && (
                <ul className="grid gap-3 text-left">
                    {entries.map((entry) => (
                        <li
                            key={entry.id}
                            className="rounded-xl border border-[var(--inv-card-border)] bg-[var(--inv-card-bg)] p-4"
                        >
                            <p className="text-sm font-medium text-[var(--inv-accent-strong)]">
                                {entry.name}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {entry.message}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
