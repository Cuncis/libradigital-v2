import { Head, Link, router, useForm } from '@inertiajs/react';
import { ExternalLink, Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Pagination } from '@/components/admin/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatIndoDate } from '@/lib/format';
import admin from '@/routes/admin';
import type { Paginated } from '@/types';
import type { InvitationStatus } from '@/types/invitation';

interface AdminInvitation {
    id: number;
    slug: string;
    couple: string;
    user_name: string;
    status: InvitationStatus;
    package: string | null;
    active_until: string | null;
    visitor_count: number;
    rsvps_count: number;
    created_at: string | null;
}

interface Props {
    invitations: Paginated<AdminInvitation>;
    filters: { search: string; status: InvitationStatus | null };
}

const STATUS: Record<
    InvitationStatus,
    {
        label: string;
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
    }
> = {
    draft: { label: 'Draft', variant: 'secondary' },
    pending_payment: { label: 'Menunggu Pembayaran', variant: 'outline' },
    active: { label: 'Aktif', variant: 'default' },
    expired: { label: 'Kadaluarsa', variant: 'destructive' },
};

const ALL = 'all';

export default function AdminInvitations({ invitations, filters }: Props) {
    const [search, setSearch] = useState(filters.search);

    const navigate = (next: { search?: string; status?: string }) => {
        router.get(
            admin.invitations.index().url,
            {
                search: next.search ?? search,
                status:
                    (next.status ?? filters.status ?? ALL) === ALL
                        ? undefined
                        : (next.status ?? filters.status ?? undefined),
            },
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Undangan - Admin" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap gap-2">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            navigate({ search });
                        }}
                        className="relative max-w-sm flex-1"
                    >
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama mempelai atau slug…"
                            className="pl-9"
                        />
                    </form>
                    <Select
                        value={filters.status ?? ALL}
                        onValueChange={(status) => navigate({ status })}
                    >
                        <SelectTrigger className="w-52">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>Semua Status</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="pending_payment">
                                Menunggu Pembayaran
                            </SelectItem>
                            <SelectItem value="active">Aktif</SelectItem>
                            <SelectItem value="expired">Kadaluarsa</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mempelai</TableHead>
                                    <TableHead>Pemilik</TableHead>
                                    <TableHead>Paket</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Aktif s/d</TableHead>
                                    <TableHead className="text-center">
                                        Tamu
                                    </TableHead>
                                    <TableHead className="text-center">
                                        RSVP
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Aksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invitations.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={9}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            Tidak ada undangan ditemukan.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    invitations.data.map((invitation) => {
                                        const status =
                                            STATUS[invitation.status];

                                        return (
                                            <TableRow key={invitation.id}>
                                                <TableCell className="font-medium">
                                                    {invitation.couple || '-'}
                                                    <div className="font-mono text-xs text-muted-foreground">
                                                        {invitation.slug}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {invitation.user_name}
                                                </TableCell>
                                                <TableCell>
                                                    {invitation.package ?? '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={status.variant}
                                                    >
                                                        {status.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {invitation.active_until
                                                        ? formatIndoDate(
                                                              invitation.active_until,
                                                          )
                                                        : '-'}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {invitation.visitor_count}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {invitation.rsvps_count}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-end gap-1">
                                                        {invitation.status ===
                                                            'active' && (
                                                            <Button
                                                                asChild
                                                                variant="ghost"
                                                                size="icon"
                                                            >
                                                                <Link
                                                                    href={`/undangan/${invitation.slug}`}
                                                                    aria-label="Buka undangan"
                                                                >
                                                                    <ExternalLink className="size-4" />
                                                                </Link>
                                                            </Button>
                                                        )}
                                                        <ManageInvitationDialog
                                                            invitation={
                                                                invitation
                                                            }
                                                        />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Pagination
                    links={invitations.links}
                    from={invitations.from}
                    to={invitations.to}
                    total={invitations.total}
                />
            </div>
        </>
    );
}

function ManageInvitationDialog({
    invitation,
}: {
    invitation: AdminInvitation;
}) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        status: invitation.status,
        active_until: invitation.active_until ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            active_until: data.active_until === '' ? null : data.active_until,
        }));
        form.patch(admin.invitations.update(invitation.id).url, {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <SlidersHorizontal className="size-4" />
                    Kelola
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Kelola undangan</DialogTitle>
                    <DialogDescription>
                        {invitation.couple || invitation.slug}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                            value={form.data.status}
                            onValueChange={(value) =>
                                form.setData(
                                    'status',
                                    value as InvitationStatus,
                                )
                            }
                        >
                            <SelectTrigger id="status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="pending_payment">
                                    Menunggu Pembayaran
                                </SelectItem>
                                <SelectItem value="active">Aktif</SelectItem>
                                <SelectItem value="expired">
                                    Kadaluarsa
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="active_until">
                            Aktif sampai (opsional)
                        </Label>
                        <Input
                            id="active_until"
                            type="date"
                            value={form.data.active_until}
                            onChange={(e) =>
                                form.setData('active_until', e.target.value)
                            }
                        />
                        <p className="text-xs text-muted-foreground">
                            Kosongkan untuk masa aktif selamanya.
                        </p>
                        {form.errors.active_until && (
                            <p className="text-sm text-destructive">
                                {form.errors.active_until}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Batal
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing && <Spinner />}
                            Simpan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

AdminInvitations.layout = () => ({
    breadcrumbs: [
        { title: 'Admin', href: admin.dashboard().url },
        { title: 'Undangan', href: admin.invitations.index().url },
    ],
});
