import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Download } from 'lucide-react';
import RsvpController from '@/actions/App/Http/Controllers/RsvpController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';

interface Rsvp {
    id: number;
    guest_name: string;
    attendance: 'hadir' | 'tidak_hadir' | 'ragu';
    message: string | null;
    created_at: string | null;
}

interface Props {
    invitation: {
        id: number;
        slug: string;
        groom_name: string | null;
        bride_name: string | null;
    };
    rsvps: {
        data: Rsvp[];
        links?: { url: string | null; label: string; active: boolean }[];
    };
    summary: {
        hadir: number;
        tidak_hadir: number;
        ragu: number;
        total: number;
    };
}

const ATTENDANCE_LABEL: Record<Rsvp['attendance'], string> = {
    hadir: 'Hadir',
    tidak_hadir: 'Tidak Hadir',
    ragu: 'Ragu',
};

const ATTENDANCE_VARIANT: Record<
    Rsvp['attendance'],
    'default' | 'secondary' | 'outline'
> = {
    hadir: 'default',
    tidak_hadir: 'outline',
    ragu: 'secondary',
};

export default function RsvpsPage({ invitation, rsvps, summary }: Props) {
    return (
        <>
            <Head title="Daftar RSVP" />
            <div className="mx-auto w-full max-w-4xl p-4">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <Link
                            href={dashboard.url()}
                            className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
                        >
                            <ArrowLeft className="size-4" /> Dashboard
                        </Link>
                        <h1 className="font-serif text-2xl">
                            RSVP — {invitation.groom_name} &amp;{' '}
                            {invitation.bride_name}
                        </h1>
                    </div>
                    <Button asChild variant="outline">
                        <a href={RsvpController.export(invitation.id).url}>
                            <Download className="size-4" /> Export CSV
                        </a>
                    </Button>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <SummaryTile label="Total" value={summary.total} />
                    <SummaryTile label="Hadir" value={summary.hadir} />
                    <SummaryTile
                        label="Tidak Hadir"
                        value={summary.tidak_hadir}
                    />
                    <SummaryTile label="Ragu" value={summary.ragu} />
                </div>

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="p-3 font-medium">Nama</th>
                                <th className="p-3 font-medium">Kehadiran</th>
                                <th className="p-3 font-medium">Ucapan</th>
                                <th className="p-3 font-medium">Waktu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rsvps.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="p-6 text-center text-muted-foreground"
                                    >
                                        Belum ada RSVP yang masuk.
                                    </td>
                                </tr>
                            )}
                            {rsvps.data.map((rsvp) => (
                                <tr
                                    key={rsvp.id}
                                    className="border-b last:border-0"
                                >
                                    <td className="p-3 font-medium">
                                        {rsvp.guest_name}
                                    </td>
                                    <td className="p-3">
                                        <Badge
                                            variant={
                                                ATTENDANCE_VARIANT[
                                                    rsvp.attendance
                                                ]
                                            }
                                        >
                                            {ATTENDANCE_LABEL[rsvp.attendance]}
                                        </Badge>
                                    </td>
                                    <td className="max-w-xs p-3 text-muted-foreground">
                                        {rsvp.message ?? '—'}
                                    </td>
                                    <td className="p-3 text-muted-foreground">
                                        {rsvp.created_at
                                            ? new Date(
                                                  rsvp.created_at,
                                              ).toLocaleString('id-ID')
                                            : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {(rsvps.links?.length ?? 0) > 3 && (
                    <div className="mt-4 flex flex-wrap gap-1">
                        {rsvps.links!.map((link, index) => (
                            <Button
                                key={index}
                                size="sm"
                                variant={link.active ? 'default' : 'outline'}
                                disabled={!link.url}
                                onClick={() =>
                                    link.url &&
                                    router.get(
                                        link.url,
                                        {},
                                        { preserveScroll: true },
                                    )
                                }
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg border p-4 text-center">
            <div className="text-2xl font-semibold">{value}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
        </div>
    );
}

RsvpsPage.layout = () => ({
    breadcrumbs: [{ title: 'RSVP', href: '#' }],
});
