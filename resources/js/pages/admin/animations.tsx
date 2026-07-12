import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Badge } from '@/components/ui/badge';
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
    Animation,
    AnimationEffectOption,
    AnimationSectionOption,
} from '@/types/invitation';

interface Props {
    animations: Animation[];
    sections: AnimationSectionOption[];
    effects: AnimationEffectOption[];
}

interface AnimationForm {
    name: string;
    section: string;
    effect: string;
    asset: File | null;
    is_active: boolean;
    [key: string]: FormDataConvertible;
}

// Loosen the useForm value type so File | boolean are accepted.
type FormDataConvertible = string | number | boolean | File | null;

export default function AdminAnimations({
    animations,
    sections,
    effects,
}: Props) {
    const [editing, setEditing] = useState<Animation | null>(null);

    const form = useForm<AnimationForm>({
        name: '',
        section: sections[0]?.value ?? 'cover',
        effect: '',
        asset: null,
        is_active: true,
    });
    const { data, setData, errors, processing, reset, clearErrors } = form;

    // Only offer effects that belong to the chosen section's family.
    const sectionIsCover =
        sections.find((s) => s.value === data.section)?.is_cover ?? false;
    const effectOptions = useMemo(
        () => effects.filter((effect) => effect.is_cover === sectionIsCover),
        [effects, sectionIsCover],
    );
    const selectedEffect = effects.find((e) => e.value === data.effect);

    const startEdit = (animation: Animation) => {
        setEditing(animation);
        clearErrors();
        setData({
            name: animation.name,
            section: animation.section,
            effect: animation.effect,
            asset: null,
            is_active: animation.is_active,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditing(null);
        reset();
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setEditing(null);
                reset();
            },
        };

        if (editing) {
            form.post(admin.animations.update(editing.id).url, options);
        } else {
            form.post(admin.animations.store().url, options);
        }
    };

    const destroy = (animation: Animation, close: () => void) => {
        router.delete(admin.animations.destroy(animation.id).url, {
            preserveScroll: true,
            onFinish: close,
        });
    };

    // Group animations by section for a tidy, section-labelled listing.
    const grouped = sections
        .map((section) => ({
            section,
            items: animations.filter((a) => a.section === section.value),
        }))
        .filter((group) => group.items.length > 0);

    return (
        <>
            <Head title="Custom Animation" />
            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center gap-3">
                    <Sparkles className="size-6 text-brand dark:text-gold" />
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Custom Animation
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Kelola animasi per bagian undangan. Untuk efek tirai
                            (curtain) & pintu (doors), unggah aset PNG tanpa
                            background.
                        </p>
                    </div>
                </div>

                {/* Create / edit form */}
                <Card>
                    <CardContent className="pt-6">
                        <form
                            onSubmit={submit}
                            className="grid gap-4 sm:grid-cols-2"
                        >
                            <div className="sm:col-span-2">
                                <h2 className="font-medium">
                                    {editing
                                        ? `Edit: ${editing.name}`
                                        : 'Tambah animasi baru'}
                                </h2>
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="name">Nama</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    placeholder="mis. Tirai Merah"
                                />
                                {errors.name && (
                                    <p className="text-xs text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-1.5">
                                <Label>Bagian (Section)</Label>
                                <Select
                                    value={data.section}
                                    onValueChange={(value) => {
                                        setData('section', value);
                                        setData('effect', '');
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sections.map((section) => (
                                            <SelectItem
                                                key={section.value}
                                                value={section.value}
                                            >
                                                {section.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-1.5">
                                <Label>Efek</Label>
                                <Select
                                    value={data.effect}
                                    onValueChange={(value) =>
                                        setData('effect', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih efek" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {effectOptions.map((effect) => (
                                            <SelectItem
                                                key={effect.value}
                                                value={effect.value}
                                            >
                                                {effect.label}
                                                {effect.requires_asset
                                                    ? ' • butuh aset'
                                                    : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.effect && (
                                    <p className="text-xs text-destructive">
                                        {errors.effect}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="asset">
                                    Aset (PNG tanpa background)
                                    {selectedEffect?.requires_asset && (
                                        <span className="text-destructive">
                                            {' '}
                                            *
                                        </span>
                                    )}
                                </Label>
                                <Input
                                    id="asset"
                                    type="file"
                                    accept="image/png,image/webp,image/gif"
                                    onChange={(e) =>
                                        setData(
                                            'asset',
                                            e.target.files?.[0] ?? null,
                                        )
                                    }
                                />
                                {editing?.asset_url && (
                                    <p className="text-xs text-muted-foreground">
                                        Aset saat ini tersimpan. Unggah untuk
                                        mengganti.
                                    </p>
                                )}
                                {errors.asset && (
                                    <p className="text-xs text-destructive">
                                        {errors.asset}
                                    </p>
                                )}
                            </div>

                            <label className="flex items-center gap-2 text-sm sm:col-span-2">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) =>
                                        setData('is_active', e.target.checked)
                                    }
                                    className="size-4"
                                />
                                Aktif (bisa dipilih pasangan di builder)
                            </label>

                            <div className="flex gap-2 sm:col-span-2">
                                <Button type="submit" disabled={processing}>
                                    {editing ? (
                                        <>
                                            <Pencil className="size-4" /> Simpan
                                            perubahan
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="size-4" /> Tambah
                                            animasi
                                        </>
                                    )}
                                </Button>
                                {editing && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={cancelEdit}
                                    >
                                        <X className="size-4" /> Batal
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Listing grouped by section */}
                {grouped.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Belum ada animasi. Tambahkan yang pertama di atas.
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
                                            <TableHead>Nama</TableHead>
                                            <TableHead>Efek</TableHead>
                                            <TableHead>Aset</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">
                                                Aksi
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {group.items.map((animation) => (
                                            <TableRow key={animation.id}>
                                                <TableCell className="font-medium">
                                                    {animation.name}
                                                </TableCell>
                                                <TableCell>
                                                    {animation.effect_label}
                                                </TableCell>
                                                <TableCell>
                                                    {animation.asset_url ? (
                                                        <img
                                                            src={
                                                                animation.asset_url
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
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            animation.is_active
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {animation.is_active
                                                            ? 'Aktif'
                                                            : 'Nonaktif'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                startEdit(
                                                                    animation,
                                                                )
                                                            }
                                                        >
                                                            <Pencil className="size-4" />
                                                            Edit
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
                                                            title="Hapus animasi?"
                                                            description={`"${animation.name}" akan dihapus permanen.`}
                                                            confirmLabel="Ya, hapus"
                                                            destructive
                                                            onConfirm={(
                                                                close,
                                                            ) =>
                                                                destroy(
                                                                    animation,
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

AdminAnimations.layout = () => ({
    breadcrumbs: [
        { title: 'Admin', href: admin.dashboard().url },
        { title: 'Animasi', href: admin.animations.index().url },
    ],
});
