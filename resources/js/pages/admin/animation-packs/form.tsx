import { useGSAP } from '@gsap/react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Play, Plus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { playAll } from '@/lib/animation-motions';
import admin from '@/routes/admin';
import type {
    AnimationAsset,
    AnimationPack,
    AnimationPackSectionOption,
    MotionOption,
    MotionType,
    Package,
} from '@/types/invitation';

interface Props {
    pack: AnimationPack | null;
    sections: AnimationPackSectionOption[];
    motions: MotionOption[];
    packages: Package[];
}

interface AssetRow {
    id: number | null;
    file: File | null;
    preview_url: string;
    motion_type: MotionType;
    position_x: number;
    position_y: number;
    width_percent: number;
    opacity: number;
    duration_ms: number;
    delay_ms: number;
    z_index: number;
}

const NUMERIC_FIELDS: {
    key: keyof AssetRow;
    label: string;
    min: number;
    max: number;
    step: number;
}[] = [
    { key: 'position_x', label: 'Posisi X %', min: 0, max: 100, step: 0.5 },
    { key: 'position_y', label: 'Posisi Y %', min: 0, max: 100, step: 0.5 },
    { key: 'width_percent', label: 'Lebar %', min: 1, max: 60, step: 0.5 },
    { key: 'opacity', label: 'Opacity', min: 0.05, max: 1, step: 0.05 },
    { key: 'duration_ms', label: 'Durasi ms', min: 300, max: 20000, step: 100 },
    { key: 'delay_ms', label: 'Delay ms', min: 0, max: 10000, step: 100 },
    { key: 'z_index', label: 'Z-index', min: 0, max: 999, step: 1 },
];

function newRow(motion: MotionType): AssetRow {
    return {
        id: null,
        file: null,
        preview_url: '',
        motion_type: motion,
        position_x: 50,
        position_y: 0,
        width_percent: 10,
        opacity: 0.9,
        duration_ms: 3000,
        delay_ms: 0,
        z_index: 10,
    };
}

function fromAsset(asset: AnimationAsset): AssetRow {
    return {
        id: asset.id,
        file: null,
        preview_url: asset.asset_url,
        motion_type: asset.motion_type,
        position_x: asset.position_x,
        position_y: asset.position_y,
        width_percent: asset.width_percent,
        opacity: asset.opacity,
        duration_ms: asset.duration_ms,
        delay_ms: asset.delay_ms,
        z_index: asset.z_index,
    };
}

export default function AnimationPackForm({
    pack,
    sections,
    motions,
    packages,
}: Props) {
    const isEdit = pack !== null;
    const defaultMotion = motions[0]?.value ?? 'float-y';

    const form = useForm<{
        name: string;
        section: string;
        available_for: string[];
        is_active: boolean;
    }>({
        name: pack?.name ?? '',
        section: pack?.section ?? sections[0]?.value ?? 'hero',
        available_for: pack?.available_for ?? [
            'standard',
            'premium',
            'signature',
        ],
        is_active: pack?.is_active ?? true,
    });
    const { data, setData, errors, processing } = form;
    // Asset errors live under dynamic keys (assets.*, new_assets.*) not in the
    // form's base data type, so read them through a widened view.
    const anyErrors = errors as Record<string, string | undefined>;
    const assetError =
        anyErrors.assets ??
        anyErrors.new_assets ??
        Object.entries(anyErrors).find(
            ([key]) =>
                key.startsWith('assets.') || key.startsWith('new_assets.'),
        )?.[1];

    const [assets, setAssets] = useState<AssetRow[]>(
        pack?.assets?.map(fromAsset) ?? [],
    );

    const updateAsset = (index: number, patch: Partial<AssetRow>) => {
        setAssets((prev) =>
            prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
        );
    };

    const addAsset = () =>
        setAssets((prev) => [...prev, newRow(defaultMotion)]);
    const removeAsset = (index: number) =>
        setAssets((prev) => prev.filter((_, i) => i !== index));

    const toggleTier = (tier: string) => {
        setData(
            'available_for',
            data.available_for.includes(tier)
                ? data.available_for.filter((t) => t !== tier)
                : [...data.available_for, tier],
        );
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        // Split into existing (kept/updated by id) and freshly uploaded assets.
        const existing = assets.filter((a) => a.id !== null);
        const fresh = assets.filter((a) => a.id === null);

        const assetParams = (a: AssetRow) => ({
            motion_type: a.motion_type,
            position_x: a.position_x,
            position_y: a.position_y,
            width_percent: a.width_percent,
            opacity: a.opacity,
            duration_ms: a.duration_ms,
            delay_ms: a.delay_ms,
            z_index: a.z_index,
        });

        form.transform(() =>
            isEdit
                ? {
                      ...data,
                      assets: existing.map((a) => ({
                          id: a.id,
                          ...assetParams(a),
                      })),
                      new_assets: fresh.map((a) => ({
                          file: a.file,
                          ...assetParams(a),
                      })),
                  }
                : {
                      ...data,
                      assets: fresh.map((a) => ({
                          file: a.file,
                          ...assetParams(a),
                      })),
                  },
        );

        const url = isEdit
            ? admin.animationPacks.update(pack!.slug).url
            : admin.animationPacks.store().url;

        form.post(url, { forceFormData: true, preserveScroll: true });
    };

    return (
        <>
            <Head
                title={isEdit ? `Edit ${pack?.name}` : 'Buat Animation Pack'}
            />
            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="icon">
                        <Link href={admin.animationPacks.index().url}>
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-semibold">
                        {isEdit ? `Edit: ${pack?.name}` : 'Buat Animation Pack'}
                    </h1>
                </div>

                <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
                    <div className="flex flex-col gap-6 lg:col-span-2">
                        {/* Pack meta */}
                        <Card>
                            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="name">Nama Pack</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        placeholder="mis. Pink Cherry Blossom"
                                    />
                                    {errors.name && (
                                        <p className="text-xs text-destructive">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="grid gap-1.5">
                                    <Label htmlFor="section">Bagian</Label>
                                    <select
                                        id="section"
                                        value={data.section}
                                        onChange={(e) =>
                                            setData('section', e.target.value)
                                        }
                                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                                    >
                                        {sections.map((section) => (
                                            <option
                                                key={section.value}
                                                value={section.value}
                                            >
                                                {section.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid gap-1.5 sm:col-span-2">
                                    <Label>Tersedia untuk paket</Label>
                                    <div className="flex flex-wrap gap-3">
                                        {packages.map((pkg) => (
                                            <label
                                                key={pkg.value}
                                                className="flex items-center gap-2 text-sm"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="size-4"
                                                    checked={data.available_for.includes(
                                                        pkg.value,
                                                    )}
                                                    onChange={() =>
                                                        toggleTier(pkg.value)
                                                    }
                                                />
                                                {pkg.label}
                                            </label>
                                        ))}
                                    </div>
                                    {errors.available_for && (
                                        <p className="text-xs text-destructive">
                                            {errors.available_for}
                                        </p>
                                    )}
                                </div>

                                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                                    <input
                                        type="checkbox"
                                        className="size-4"
                                        checked={data.is_active}
                                        onChange={(e) =>
                                            setData(
                                                'is_active',
                                                e.target.checked,
                                            )
                                        }
                                    />
                                    Aktif (bisa dipilih pasangan)
                                </label>
                            </CardContent>
                        </Card>

                        {/* Assets */}
                        <Card>
                            <CardContent className="flex flex-col gap-4 pt-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="font-medium">
                                        Aset ({assets.length}/10)
                                    </h2>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addAsset}
                                        disabled={assets.length >= 10}
                                    >
                                        <Plus className="size-4" /> Tambah Aset
                                    </Button>
                                </div>

                                {assetError && (
                                    <p className="text-xs text-destructive">
                                        {assetError}
                                    </p>
                                )}
                                {assets.length === 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        Belum ada aset. Tambahkan PNG transparan
                                        (maks 200KB).
                                    </p>
                                )}

                                {assets.map((asset, index) => (
                                    <div
                                        key={index}
                                        className="grid gap-3 rounded-lg border p-4"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="size-14 shrink-0 overflow-hidden rounded border bg-muted">
                                                {asset.preview_url && (
                                                    <img
                                                        src={asset.preview_url}
                                                        alt=""
                                                        className="size-full object-contain"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                {asset.id === null ? (
                                                    <Input
                                                        type="file"
                                                        accept="image/png,image/webp"
                                                        onChange={(e) => {
                                                            const file =
                                                                e.target
                                                                    .files?.[0] ??
                                                                null;
                                                            updateAsset(index, {
                                                                file,
                                                                preview_url:
                                                                    file
                                                                        ? URL.createObjectURL(
                                                                              file,
                                                                          )
                                                                        : '',
                                                            });
                                                        }}
                                                    />
                                                ) : (
                                                    <p className="text-xs text-muted-foreground">
                                                        Aset tersimpan
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive"
                                                onClick={() =>
                                                    removeAsset(index)
                                                }
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label className="text-xs">
                                                Motion
                                            </Label>
                                            <select
                                                value={asset.motion_type}
                                                onChange={(e) =>
                                                    updateAsset(index, {
                                                        motion_type: e.target
                                                            .value as MotionType,
                                                    })
                                                }
                                                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                                            >
                                                {motions.map((motion) => (
                                                    <option
                                                        key={motion.value}
                                                        value={motion.value}
                                                    >
                                                        {motion.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                            {NUMERIC_FIELDS.map((field) => (
                                                <div
                                                    key={field.key}
                                                    className="grid gap-1"
                                                >
                                                    <Label className="text-xs">
                                                        {field.label}
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        min={field.min}
                                                        max={field.max}
                                                        step={field.step}
                                                        value={
                                                            asset[
                                                                field.key
                                                            ] as number
                                                        }
                                                        onChange={(e) =>
                                                            updateAsset(index, {
                                                                [field.key]:
                                                                    Number(
                                                                        e.target
                                                                            .value,
                                                                    ),
                                                            })
                                                        }
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <div>
                            <Button type="submit" disabled={processing}>
                                {isEdit ? 'Simpan Perubahan' : 'Buat Pack'}
                            </Button>
                        </div>
                    </div>

                    {/* Live preview */}
                    <div className="lg:col-span-1">
                        <PackPreview assets={assets} />
                    </div>
                </form>
            </div>
        </>
    );
}

function PackPreview({ assets }: { assets: AssetRow[] }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [playKey, setPlayKey] = useState(0);

    const renderable = assets
        .filter((a) => a.preview_url)
        .map((a, i) => ({ ...a, id: a.id ?? -(i + 1) }));

    useGSAP(
        () => {
            if (containerRef.current && renderable.length > 0) {
                playAll(
                    containerRef.current,
                    renderable as unknown as AnimationAsset[],
                );
            }
        },
        { scope: containerRef, dependencies: [playKey] },
    );

    return (
        <Card className="sticky top-4">
            <CardContent className="pt-6">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-medium">Preview</h2>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPlayKey((k) => k + 1)}
                    >
                        <Play className="size-4" /> Play
                    </Button>
                </div>
                <div
                    ref={containerRef}
                    key={playKey}
                    className="relative h-96 overflow-hidden rounded-lg"
                    style={{
                        background:
                            'linear-gradient(135deg, #fdf4f7 0%, #fce8ef 50%, #f9dde7 100%)',
                    }}
                >
                    {renderable.map((asset) => (
                        <img
                            key={asset.id}
                            data-asset={asset.id}
                            src={asset.preview_url}
                            alt=""
                            draggable={false}
                            className="absolute will-change-transform select-none"
                            style={{
                                left: `${asset.position_x}%`,
                                top: `${asset.position_y}%`,
                                width: `${asset.width_percent}%`,
                                opacity: asset.opacity,
                                zIndex: asset.z_index,
                            }}
                        />
                    ))}
                    <div className="absolute inset-0 flex items-center justify-center text-center text-xs text-stone-400">
                        {renderable.length === 0 &&
                            'Tambahkan aset untuk preview'}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

AnimationPackForm.layout = () => ({
    breadcrumbs: [
        { title: 'Admin', href: admin.dashboard().url },
        { title: 'Animation Packs', href: admin.animationPacks.index().url },
    ],
});
