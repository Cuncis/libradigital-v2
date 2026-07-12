import { Head, Link, useForm } from '@inertiajs/react';
import { Eye, Heart, PartyPopper, Pencil, Users } from 'lucide-react';
import InvitationController from '@/actions/App/Http/Controllers/InvitationController';
import RsvpController from '@/actions/App/Http/Controllers/RsvpController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import type { InvitationStatus } from '@/types/invitation';

interface Invitation {
    id: number;
    slug: string;
    status: InvitationStatus;
    groom_name: string | null;
    bride_name: string | null;
    visitor_count: number;
    rsvps_count: number;
}

const STATUS_LABELS: Record<InvitationStatus, string> = {
    draft: 'Draft',
    pending_payment: 'Menunggu Pembayaran',
    active: 'Aktif',
    expired: 'Kadaluarsa',
};

export default function Dashboard({
    invitation,
}: {
    invitation: Invitation | null;
}) {
    return (
        <>
            <Head title="Dashboard" />
            <div className="mx-auto w-full max-w-4xl p-4">
                {invitation ? (
                    <InvitationCard invitation={invitation} />
                ) : (
                    <CreateInvitation />
                )}
            </div>
        </>
    );
}

function InvitationCard({ invitation }: { invitation: Invitation }) {
    const isActive = invitation.status === 'active';
    const publicUrl = `/undangan/${invitation.slug}`;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle className="text-2xl">
                            {invitation.groom_name} &amp;{' '}
                            {invitation.bride_name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                            libradigital.id/undangan/{invitation.slug}
                        </CardDescription>
                    </div>
                    <Badge variant={isActive ? 'default' : 'secondary'}>
                        {STATUS_LABELS[invitation.status]}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="grid grid-cols-2 gap-4">
                <Stat
                    icon={<Users className="size-5" />}
                    label="Tamu membuka"
                    value={invitation.visitor_count}
                />
                <Stat
                    icon={<PartyPopper className="size-5" />}
                    label="RSVP masuk"
                    value={invitation.rsvps_count}
                />
            </CardContent>

            <CardFooter className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                    <Link href={InvitationController.edit(invitation.id).url}>
                        <Pencil className="size-4" />{' '}
                        {isActive ? 'Edit' : 'Lanjutkan & Aktifkan'}
                    </Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href={RsvpController.index(invitation.id).url}>
                        <Users className="size-4" /> Daftar RSVP
                    </Link>
                </Button>
                {isActive && (
                    <Button asChild variant="outline">
                        <a
                            href={publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Eye className="size-4" /> Preview
                        </a>
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}

function Stat({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
}) {
    return (
        <div className="flex items-center gap-3 rounded-lg border p-4">
            <div className="text-muted-foreground">{icon}</div>
            <div>
                <div className="text-2xl font-semibold">{value}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
            </div>
        </div>
    );
}

function CreateInvitation() {
    const form = useForm({ groom_name: '', bride_name: '' });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(InvitationController.store().url);
    };

    return (
        <Card>
            <CardHeader className="items-center text-center">
                <Heart className="size-10 text-rose-500" />
                <CardTitle>Buat undangan pernikahan pertama Anda</CardTitle>
                <CardDescription>
                    Masukkan nama mempelai untuk mulai membangun undangan Anda.
                </CardDescription>
            </CardHeader>
            <form onSubmit={submit}>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="groom_name">Nama Mempelai Pria</Label>
                        <Input
                            id="groom_name"
                            value={form.data.groom_name}
                            onChange={(e) =>
                                form.setData('groom_name', e.target.value)
                            }
                            placeholder="Budi"
                            required
                        />
                        {form.errors.groom_name && (
                            <p className="text-sm text-destructive">
                                {form.errors.groom_name}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="bride_name">Nama Mempelai Wanita</Label>
                        <Input
                            id="bride_name"
                            value={form.data.bride_name}
                            onChange={(e) =>
                                form.setData('bride_name', e.target.value)
                            }
                            placeholder="Siti"
                            required
                        />
                        {form.errors.bride_name && (
                            <p className="text-sm text-destructive">
                                {form.errors.bride_name}
                            </p>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        type="submit"
                        disabled={form.processing}
                        className="w-full"
                    >
                        {form.processing && <Spinner />}
                        Mulai Buat Undangan
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

Dashboard.layout = () => ({
    breadcrumbs: [{ title: 'Dashboard', href: dashboard.url() }],
});
