import { Head, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { Pagination } from '@/components/admin/pagination';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

interface AdminUser {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
    email_verified_at: string | null;
    invitations_count: number;
    orders_count: number;
    created_at: string | null;
}

interface Props {
    users: Paginated<AdminUser>;
    filters: { search: string };
}

export default function AdminUsers({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            admin.users.index().url,
            { search },
            { preserveState: true, replace: true },
        );
    };

    return (
        <>
            <Head title="Pengguna — Admin" />
            <div className="flex flex-col gap-4 p-4">
                <form onSubmit={submit} className="flex max-w-sm gap-2">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama atau email…"
                            className="pl-9"
                        />
                    </div>
                </form>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-center">
                                        Undangan
                                    </TableHead>
                                    <TableHead className="text-center">
                                        Pesanan
                                    </TableHead>
                                    <TableHead>Bergabung</TableHead>
                                    <TableHead>Peran</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            Tidak ada pengguna ditemukan.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.data.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {user.name}
                                                    {!user.email_verified_at && (
                                                        <Badge variant="outline">
                                                            Belum verifikasi
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {user.email}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {user.invitations_count}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {user.orders_count}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {user.created_at
                                                    ? formatIndoDate(
                                                          user.created_at,
                                                      )
                                                    : '—'}
                                            </TableCell>
                                            <TableCell>
                                                {user.is_admin ? (
                                                    <Badge>Admin</Badge>
                                                ) : (
                                                    <Badge variant="secondary">
                                                        Pengguna
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Pagination
                    links={users.links}
                    from={users.from}
                    to={users.to}
                    total={users.total}
                />
            </div>
        </>
    );
}

AdminUsers.layout = () => ({
    breadcrumbs: [
        { title: 'Admin', href: admin.dashboard().url },
        { title: 'Pengguna', href: admin.users.index().url },
    ],
});
