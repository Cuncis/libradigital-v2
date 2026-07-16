import { Head, Link, router } from '@inertiajs/react';
import { Eye, LayoutTemplate, Pencil, RotateCcw } from 'lucide-react';
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
import type { InvitationTemplate } from '@/types/invitation';

interface Props {
    templates: InvitationTemplate[];
}

export default function AdminTemplates({ templates }: Props) {
    const reset = (template: InvitationTemplate, close: () => void) => {
        router.delete(admin.templates.reset(template.id).url, {
            preserveScroll: true,
            onFinish: close,
        });
    };

    return (
        <>
            <Head title="Templates" />
            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center gap-3">
                    <LayoutTemplate className="size-6 text-brand dark:text-gold" />
                    <div>
                        <h1 className="text-2xl font-semibold">Templates</h1>
                        <p className="text-sm text-muted-foreground">
                            Susun tata letak undangan secara visual - seret
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
                                                <div className="flex justify-end gap-2">
                                                    <ConfirmDialog
                                                        trigger={
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-destructive"
                                                                disabled={
                                                                    !template.has_custom_layout &&
                                                                    !template.has_custom_cover
                                                                }
                                                            >
                                                                <RotateCcw className="size-4" />
                                                                Reset
                                                            </Button>
                                                        }
                                                        title="Reset template?"
                                                        description={`Layout dan cover kustom "${template.name}" akan dihapus dan dikembalikan ke bawaan. Tindakan ini tidak bisa dibatalkan.`}
                                                        confirmLabel="Ya, reset"
                                                        destructive
                                                        onConfirm={(close) =>
                                                            reset(
                                                                template,
                                                                close,
                                                            )
                                                        }
                                                    />
                                                    <Button
                                                        asChild
                                                        variant="ghost"
                                                        size="sm"
                                                    >
                                                        <a
                                                            href={
                                                                admin.templates.preview(
                                                                    template.id,
                                                                ).url
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <Eye className="size-4" />
                                                            Preview
                                                        </a>
                                                    </Button>
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
                                                </div>
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
