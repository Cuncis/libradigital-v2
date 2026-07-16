import { Head, router } from '@inertiajs/react';
import { RotateCcw, Search } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Pagination } from '@/components/admin/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatIndoDate, formatRupiah } from '@/lib/format';
import admin from '@/routes/admin';
import type { Paginated } from '@/types';
import type { OrderStatus } from '@/types/invitation';

interface AdminOrder {
    id: number;
    order_number: string;
    user_name: string;
    user_email: string;
    package: string;
    addon_amount: number;
    total_amount: number;
    status: OrderStatus;
    paid_at: string | null;
    created_at: string | null;
}

interface Props {
    orders: Paginated<AdminOrder>;
    filters: { search: string; status: OrderStatus | null };
}

const STATUS: Record<
    OrderStatus,
    {
        label: string;
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
    }
> = {
    pending: { label: 'Menunggu', variant: 'secondary' },
    paid: { label: 'Lunas', variant: 'default' },
    failed: { label: 'Gagal', variant: 'destructive' },
    refunded: { label: 'Refund', variant: 'outline' },
};

const ALL = 'all';

export default function AdminOrders({ orders, filters }: Props) {
    const [search, setSearch] = useState(filters.search);

    const refund = (order: AdminOrder, close: () => void) => {
        router.patch(
            admin.orders.refund(order.id).url,
            {},
            { preserveScroll: true, onFinish: close },
        );
    };

    const navigate = (next: { search?: string; status?: string }) => {
        router.get(
            admin.orders.index().url,
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
            <Head title="Pesanan - Admin" />
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
                            placeholder="Cari nomor order atau pengguna…"
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
                            <SelectItem value="pending">Menunggu</SelectItem>
                            <SelectItem value="paid">Lunas</SelectItem>
                            <SelectItem value="failed">Gagal</SelectItem>
                            <SelectItem value="refunded">Refund</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order</TableHead>
                                    <TableHead>Pengguna</TableHead>
                                    <TableHead>Paket</TableHead>
                                    <TableHead className="text-right">
                                        Total
                                    </TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Dibayar</TableHead>
                                    <TableHead className="text-right">
                                        Aksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            Tidak ada pesanan ditemukan.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    orders.data.map((order) => {
                                        const status = STATUS[order.status];

                                        return (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-mono text-xs">
                                                    {order.order_number}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {order.user_name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {order.user_email}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {order.package}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatRupiah(
                                                        order.total_amount,
                                                    )}
                                                    {order.addon_amount > 0 && (
                                                        <div className="text-xs font-normal text-muted-foreground">
                                                            +
                                                            {formatRupiah(
                                                                order.addon_amount,
                                                            )}{' '}
                                                            add-on
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={status.variant}
                                                    >
                                                        {status.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {order.paid_at
                                                        ? formatIndoDate(
                                                              order.paid_at,
                                                          )
                                                        : '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {order.status ===
                                                        'paid' && (
                                                        <ConfirmDialog
                                                            trigger={
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                >
                                                                    <RotateCcw className="size-4" />
                                                                    Refund
                                                                </Button>
                                                            }
                                                            title="Tandai sebagai refund?"
                                                            description={`Pesanan ${order.order_number} akan ditandai refund. Akses undangan tidak otomatis dicabut - kadaluarsakan undangan dari halaman Undangan bila perlu.`}
                                                            confirmLabel="Tandai Refund"
                                                            destructive
                                                            onConfirm={(
                                                                close,
                                                            ) =>
                                                                refund(
                                                                    order,
                                                                    close,
                                                                )
                                                            }
                                                        />
                                                    )}
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
                    links={orders.links}
                    from={orders.from}
                    to={orders.to}
                    total={orders.total}
                />
            </div>
        </>
    );
}

AdminOrders.layout = () => ({
    breadcrumbs: [
        { title: 'Admin', href: admin.dashboard().url },
        { title: 'Pesanan', href: admin.orders.index().url },
    ],
});
