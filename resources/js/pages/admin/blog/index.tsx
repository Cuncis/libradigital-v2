import { Head, Link, router } from '@inertiajs/react';
import { ExternalLink, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Pagination } from '@/components/admin/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

interface AdminPost {
    id: number;
    title: string;
    slug: string;
    category_label: string;
    status: string;
    status_label: string;
    author_name: string;
    published_at: string | null;
    url: string;
}

interface Props {
    posts: Paginated<AdminPost>;
    filters: { search: string };
}

export default function AdminBlogIndex({ posts, filters }: Props) {
    const [search, setSearch] = useState(filters.search);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            admin.blog.index().url,
            { search },
            { preserveState: true, replace: true },
        );
    };

    const destroy = (post: AdminPost, close: () => void) => {
        router.delete(admin.blog.destroy(post.slug).url, {
            preserveScroll: true,
            onFinish: close,
        });
    };

    return (
        <>
            <Head title="Blog — Admin" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center justify-between gap-2">
                    <form
                        onSubmit={submit}
                        className="flex max-w-sm flex-1 gap-2"
                    >
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari judul artikel…"
                                className="pl-9"
                            />
                        </div>
                    </form>
                    <Button asChild>
                        <Link href={admin.blog.create().url}>
                            <Plus className="size-4" /> Artikel Baru
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Judul</TableHead>
                                    <TableHead>Kategori</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Terbit</TableHead>
                                    <TableHead className="text-right">
                                        Aksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {posts.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            Belum ada artikel.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    posts.data.map((post) => (
                                        <TableRow key={post.id}>
                                            <TableCell className="font-medium">
                                                {post.title}
                                                <span className="block text-xs text-muted-foreground">
                                                    oleh {post.author_name}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {post.category_label}
                                            </TableCell>
                                            <TableCell>
                                                {post.status === 'published' ? (
                                                    <Badge>
                                                        {post.status_label}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">
                                                        {post.status_label}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {post.published_at
                                                    ? formatIndoDate(
                                                          post.published_at,
                                                      )
                                                    : '—'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-end gap-1">
                                                    {post.status ===
                                                        'published' && (
                                                        <Button
                                                            asChild
                                                            variant="ghost"
                                                            size="icon"
                                                        >
                                                            <a
                                                                href={post.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                <ExternalLink className="size-4" />
                                                            </a>
                                                        </Button>
                                                    )}
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Link
                                                            href={
                                                                admin.blog.edit(
                                                                    post.slug,
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
                                                        title="Hapus artikel?"
                                                        description={`"${post.title}" akan dihapus permanen.`}
                                                        confirmLabel="Ya, hapus"
                                                        destructive
                                                        onConfirm={(close) =>
                                                            destroy(post, close)
                                                        }
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Pagination
                    links={posts.links}
                    from={posts.from}
                    to={posts.to}
                    total={posts.total}
                />
            </div>
        </>
    );
}

AdminBlogIndex.layout = () => ({
    breadcrumbs: [
        { title: 'Admin', href: admin.dashboard().url },
        { title: 'Blog', href: admin.blog.index().url },
    ],
});
