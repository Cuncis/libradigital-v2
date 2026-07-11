import { Head, Link } from '@inertiajs/react';
import {
    CreditCard,
    FileText,
    HeartHandshake,
    Users,
    Wallet,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatRupiah } from '@/lib/format';
import admin from '@/routes/admin';
import type { OrderStatus } from '@/types/invitation';

interface RecentOrder {
    id: number;
    order_number: string;
    user_name: string;
    package: string;
    total_amount: number;
    status: OrderStatus;
    created_at: string | null;
}

interface Props {
    stats: {
        users: number;
        invitations: number;
        active_invitations: number;
        paid_orders: number;
        revenue: number;
    };
    invitationsByStatus: {
        draft: number;
        pending_payment: number;
        active: number;
        expired: number;
    };
    recentOrders: RecentOrder[];
}

const ORDER_STATUS: Record<
    OrderStatus,
    { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
    pending: { label: 'Menunggu', variant: 'secondary' },
    paid: { label: 'Lunas', variant: 'default' },
    failed: { label: 'Gagal', variant: 'destructive' },
    refunded: { label: 'Refund', variant: 'outline' },
};

export default function AdminDashboard({
    stats,
    invitationsByStatus,
    recentOrders,
}: Props) {
    return (
        <>
            <Head title="Admin" />
            <div className="flex flex-col gap-6 p-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        icon={<Users className="size-5" />}
                        label="Total Pengguna"
                        value={stats.users.toLocaleString('id-ID')}
                    />
                    <StatCard
                        icon={<FileText className="size-5" />}
                        label="Total Undangan"
                        value={stats.invitations.toLocaleString('id-ID')}
                        hint={`${stats.active_invitations} aktif`}
                    />
                    <StatCard
                        icon={<CreditCard className="size-5" />}
                        label="Pesanan Lunas"
                        value={stats.paid_orders.toLocaleString('id-ID')}
                    />
                    <StatCard
                        icon={<Wallet className="size-5" />}
                        label="Total Pendapatan"
                        value={formatRupiah(stats.revenue)}
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HeartHandshake className="size-5" /> Undangan per
                                Status
                            </CardTitle>
                            <CardDescription>
                                Sebaran undangan berdasarkan status saat ini.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-3">
                            <StatusTile
                                label="Draft"
                                value={invitationsByStatus.draft}
                            />
                            <StatusTile
                                label="Menunggu Pembayaran"
                                value={invitationsByStatus.pending_payment}
                            />
                            <StatusTile
                                label="Aktif"
                                value={invitationsByStatus.active}
                            />
                            <StatusTile
                                label="Kadaluarsa"
                                value={invitationsByStatus.expired}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Pesanan Terbaru</CardTitle>
                            <CardDescription>
                                <Link
                                    href={admin.orders.index().url}
                                    className="underline-offset-4 hover:underline"
                                >
                                    Lihat semua pesanan
                                </Link>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentOrders.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    Belum ada pesanan.
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Order</TableHead>
                                            <TableHead>Pengguna</TableHead>
                                            <TableHead className="text-right">
                                                Total
                                            </TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentOrders.map((order) => {
                                            const status =
                                                ORDER_STATUS[order.status];

                                            return (
                                                <TableRow key={order.id}>
                                                    <TableCell className="font-mono text-xs">
                                                        {order.order_number}
                                                    </TableCell>
                                                    <TableCell>
                                                        {order.user_name}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formatRupiah(
                                                            order.total_amount,
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                status.variant
                                                            }
                                                        >
                                                            {status.label}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

function StatCard({
    icon,
    label,
    value,
    hint,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    hint?: string;
}) {
    return (
        <Card>
            <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    {icon}
                </div>
                <div className="min-w-0">
                    <div className="truncate text-2xl font-semibold">
                        {value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {label}
                        {hint ? ` · ${hint}` : ''}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function StatusTile({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg border p-4">
            <div className="text-2xl font-semibold">{value}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
        </div>
    );
}

AdminDashboard.layout = () => ({
    breadcrumbs: [{ title: 'Admin', href: admin.dashboard().url }],
});
