import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2, Wand2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import admin from '@/routes/admin';
import type {
    AnimationPack,
    AnimationPackSectionOption,
} from '@/types/invitation';

interface Props {
    packs: AnimationPack[];
    sections: AnimationPackSectionOption[];
}

export default function AdminAnimationPacks({ packs, sections }: Props) {
    const destroy = (pack: AnimationPack, close: () => void) => {
        router.delete(admin.animationPacks.destroy(pack.slug).url, {
            preserveScroll: true,
            onFinish: close,
        });
    };

    const grouped = sections
        .map((section) => ({
            section,
            items: packs.filter((p) => p.section === section.value),
        }))
        .filter((group) => group.items.length > 0);

    return (
        <>
            <Head title="Animation Packs" />
            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Wand2 className="size-6 text-brand dark:text-gold" />
                        <div>
                            <h1 className="text-2xl font-semibold">
                                Animation Packs
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Efek melayang (kelopak, glitter) berbasis GSAP.
                                Satu pack = satu bagian undangan.
                            </p>
                        </div>
                    </div>
                    <Button asChild>
                        <Link href={admin.animationPacks.create().url}>
                            <Plus className="size-4" /> Buat Pack
                        </Link>
                    </Button>
                </div>

                {grouped.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Belum ada pack. Buat yang pertama.
                    </p>
                ) : (
                    grouped.map((group) => (
                        <Card key={group.section.value}>
                            <CardContent className="pt-6">
                                <h3 className="mb-3 font-medium">
                                    {group.section.label}
                                </h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Thumbnail</TableHead>
                                            <TableHead>Nama</TableHead>
                                            <TableHead>Aset</TableHead>
                                            <TableHead>Paket</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">
                                                Aksi
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {group.items.map((pack) => (
                                            <TableRow key={pack.slug}>
                                                <TableCell>
                                                    {pack.thumbnail_url ? (
                                                        <img
                                                            src={
                                                                pack.thumbnail_url
                                                            }
                                                            alt=""
                                                            className="size-10 rounded object-contain"
                                                        />
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {pack.name}
                                                </TableCell>
                                                <TableCell>
                                                    {pack.assets_count ?? 0}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {pack.available_for.map(
                                                            (tier) => (
                                                                <Badge
                                                                    key={tier}
                                                                    variant="outline"
                                                                    className="capitalize"
                                                                >
                                                                    {tier}
                                                                </Badge>
                                                            ),
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            pack.is_active
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {pack.is_active
                                                            ? 'Aktif'
                                                            : 'Nonaktif'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            asChild
                                                            variant="outline"
                                                            size="sm"
                                                        >
                                                            <Link
                                                                href={
                                                                    admin.animationPacks.edit(
                                                                        pack.slug,
                                                                    ).url
                                                                }
                                                            >
                                                                <Pencil className="size-4" />
                                                                Edit
                                                            </Link>
                                                        </Button>
                                                        <ConfirmDialog
                                                            trigger={
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-destructive"
                                                                >
                                                                    <Trash2 className="size-4" />
                                                                </Button>
                                                            }
                                                            title="Hapus pack?"
                                                            description={`"${pack.name}" dan semua asetnya akan dihapus permanen.`}
                                                            confirmLabel="Ya, hapus"
                                                            destructive
                                                            onConfirm={(
                                                                close,
                                                            ) =>
                                                                destroy(
                                                                    pack,
                                                                    close,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </>
    );
}

AdminAnimationPacks.layout = () => ({
    breadcrumbs: [
        { title: 'Admin', href: admin.dashboard().url },
        { title: 'Animation Packs', href: admin.animationPacks.index().url },
    ],
});
