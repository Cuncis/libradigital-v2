import { Head, Link } from '@inertiajs/react';
import { LayoutTemplate, Pencil } from 'lucide-react';
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
import type { InvitationTemplate } from '@/types/invitation';

interface Props {
    templates: InvitationTemplate[];
}

export default function AdminTemplates({ templates }: Props) {
    return (
        <>
            <Head title="Templates" />
            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center gap-3">
                    <LayoutTemplate className="size-6 text-brand dark:text-gold" />
                    <div>
                        <h1 className="text-2xl font-semibold">Templates</h1>
                        <p className="text-sm text-muted-foreground">
                            Susun tata letak undangan secara visual — seret
                            blok, atur konten, dan simpan sebagai layout
                            template.
                        </p>
                    </div>
                </div>

                {templates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Belum ada template.
                    </p>
                ) : (
                    <Card>
                        <CardContent className="pt-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Layout</TableHead>
                                        <TableHead className="text-right">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {templates.map((template) => (
                                        <TableRow key={template.id}>
                                            <TableCell className="font-medium">
                                                {template.name}
                                            </TableCell>
                                            <TableCell className="capitalize">
                                                {template.category}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        template.has_custom_layout
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {template.has_custom_layout
                                                        ? 'Custom'
                                                        : 'Bawaan'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    <Link
                                                        href={
                                                            admin.templates.builder(
                                                                template.id,
                                                            ).url
                                                        }
                                                    >
                                                        <Pencil className="size-4" />
                                                        Buka Builder
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

AdminTemplates.layout = () => ({
    breadcrumbs: [
        { title: 'Admin', href: admin.dashboard().url },
        { title: 'Templates', href: admin.templates.index().url },
    ],
});
