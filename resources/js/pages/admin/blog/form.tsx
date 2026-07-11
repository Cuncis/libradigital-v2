import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import admin from '@/routes/admin';

interface Post {
    slug: string;
    title: string;
    category: string;
    status: string;
    excerpt: string | null;
    body: string;
    cover_url: string | null;
}

interface Option {
    value: string;
    label: string;
}

interface Props {
    post: Post | null;
    categories: Option[];
    statuses: Option[];
}

export default function AdminBlogForm({ post, categories, statuses }: Props) {
    const isEdit = post !== null;

    const { data, setData, post: submit, processing, errors } = useForm<{
        title: string;
        category: string;
        status: string;
        excerpt: string;
        body: string;
        cover: File | null;
    }>({
        title: post?.title ?? '',
        category: post?.category ?? categories[0]?.value ?? '',
        status: post?.status ?? statuses[0]?.value ?? '',
        excerpt: post?.excerpt ?? '',
        body: post?.body ?? '',
        cover: null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const url = isEdit
            ? admin.blog.update(post!.slug).url
            : admin.blog.store().url;

        submit(url, { forceFormData: true });
    };

    return (
        <>
            <Head title={isEdit ? 'Edit Artikel — Admin' : 'Artikel Baru — Admin'} />
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
                <button
                    type="button"
                    onClick={() => router.get(admin.blog.index().url)}
                    className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="size-4" /> Kembali ke daftar
                </button>

                <Card>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Judul</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) =>
                                        setData('title', e.target.value)
                                    }
                                    placeholder="Judul artikel"
                                />
                                {errors.title && (
                                    <p className="text-sm text-destructive">
                                        {errors.title}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="category">Kategori</Label>
                                    <Select
                                        value={data.category}
                                        onValueChange={(value) =>
                                            setData('category', value)
                                        }
                                    >
                                        <SelectTrigger id="category">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem
                                                    key={category.value}
                                                    value={category.value}
                                                >
                                                    {category.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.category && (
                                        <p className="text-sm text-destructive">
                                            {errors.category}
                                        </p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={data.status}
                                        onValueChange={(value) =>
                                            setData('status', value)
                                        }
                                    >
                                        <SelectTrigger id="status">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statuses.map((status) => (
                                                <SelectItem
                                                    key={status.value}
                                                    value={status.value}
                                                >
                                                    {status.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.status && (
                                        <p className="text-sm text-destructive">
                                            {errors.status}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="excerpt">
                                    Ringkasan{' '}
                                    <span className="text-muted-foreground">
                                        (opsional)
                                    </span>
                                </Label>
                                <Textarea
                                    id="excerpt"
                                    value={data.excerpt}
                                    onChange={(e) =>
                                        setData('excerpt', e.target.value)
                                    }
                                    rows={2}
                                    placeholder="Ringkasan singkat yang tampil di kartu artikel"
                                />
                                {errors.excerpt && (
                                    <p className="text-sm text-destructive">
                                        {errors.excerpt}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="body">Isi Artikel</Label>
                                <Textarea
                                    id="body"
                                    value={data.body}
                                    onChange={(e) =>
                                        setData('body', e.target.value)
                                    }
                                    rows={14}
                                    placeholder="Tulis isi artikel di sini. Pisahkan paragraf dengan baris kosong."
                                />
                                {errors.body && (
                                    <p className="text-sm text-destructive">
                                        {errors.body}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="cover">
                                    Gambar Sampul{' '}
                                    <span className="text-muted-foreground">
                                        (opsional)
                                    </span>
                                </Label>
                                {post?.cover_url && (
                                    <img
                                        src={post.cover_url}
                                        alt="Sampul saat ini"
                                        className="aspect-[16/9] w-full max-w-sm rounded-md object-cover"
                                    />
                                )}
                                <Input
                                    id="cover"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        setData(
                                            'cover',
                                            e.target.files?.[0] ?? null,
                                        )
                                    }
                                />
                                {errors.cover && (
                                    <p className="text-sm text-destructive">
                                        {errors.cover}
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        router.get(admin.blog.index().url)
                                    }
                                >
                                    Batal
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {isEdit ? 'Simpan Perubahan' : 'Terbitkan'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AdminBlogForm.layout = () => ({
    breadcrumbs: [
        { title: 'Admin', href: admin.dashboard().url },
        { title: 'Blog', href: admin.blog.index().url },
    ],
});
