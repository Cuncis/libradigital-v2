import { Head, Link, useForm } from '@inertiajs/react';
import html2canvas from 'html2canvas';
import { ArrowLeft, Pause, Play, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { buildTimeline } from '@/lib/animation-motions';
import { cn } from '@/lib/utils';
import admin from '@/routes/admin';
import type {
    AnimationAsset,
    AnimationPack,
    AnimationPackSectionOption,
    AnimationPackSectionType,
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

// Canvas backdrop simulating each section's real look.
const SECTION_BG: Record<AnimationPackSectionType, string> = {
    hero: 'linear-gradient(160deg,#1b2a3a 0%,#24405c 60%,#12354c 100%)',
    gallery: 'linear-gradient(160deg,#f4f1ec 0%,#e7ddd0 100%)',
    story: 'linear-gradient(160deg,#fdf4f7 0%,#f9dde7 100%)',
    event: 'linear-gradient(160deg,#f5f7f9 0%,#dde7ee 100%)',
    footer: 'linear-gradient(160deg,#2a2320 0%,#4a3f38 100%)',
    full_page: 'linear-gradient(160deg,#1b2a3a 0%,#3a2a4c 100%)',
};

const NUMERIC_FIELDS: {
    key: keyof AssetRow;
    label: string;
    min: number;
    max: number;
    step: number;
}[] = [
    { key: 'width_percent', label: 'Lebar %', min: 1, max: 60, step: 0.5 },
    { key: 'opacity', label: 'Opacity', min: 0.05, max: 1, step: 0.05 },
    { key: 'duration_ms', label: 'Durasi ms', min: 300, max: 20000, step: 100 },
    { key: 'delay_ms', label: 'Delay ms', min: 0, max: 10000, step: 100 },
    { key: 'z_index', label: 'Z-index', min: 0, max: 999, step: 1 },
];

const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

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
        section: AnimationPackSectionType;
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
    const [selected, setSelected] = useState<number | null>(null);
    const [playing, setPlaying] = useState(false);

    // The duration bar is driven by refs (not state) so it updates smoothly at
    // 60fps without re-rendering the whole builder each frame.
    const progressFillRef = useRef<HTMLDivElement>(null);
    const progressHandleRef = useRef<HTMLDivElement>(null);
    const progressTimeRef = useRef<HTMLSpanElement>(null);

    // One loop = the longest (delay + duration) across all assets.
    const cycleMs = assets.length
        ? Math.max(...assets.map((a) => a.delay_ms + a.duration_ms))
        : 0;
    const cycleSec = cycleMs / 1000;

    const paintProgress = (t: number) => {
        const pct = `${t * 100}%`;

        if (progressFillRef.current) {
            progressFillRef.current.style.width = pct;
        }

        if (progressHandleRef.current) {
            progressHandleRef.current.style.left = pct;
        }

        if (progressTimeRef.current) {
            progressTimeRef.current.textContent = `${(t * cycleSec).toFixed(1)}s`;
        }
    };

    const canvasRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{
        index: number;
        offX: number;
        offY: number;
    } | null>(null);

    const updateAsset = (index: number, patch: Partial<AssetRow>) => {
        setAssets((prev) =>
            prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
        );
    };

    const addFiles = (files: FileList | null) => {
        if (!files) {
            return;
        }

        const rows = Array.from(files)
            .slice(0, 10 - assets.length)
            .map((file): AssetRow => ({
                id: null,
                file,
                preview_url: URL.createObjectURL(file),
                motion_type: defaultMotion,
                position_x: 40,
                position_y: 10,
                width_percent: 12,
                opacity: 0.9,
                duration_ms: 3000,
                delay_ms: 0,
                z_index: 10,
            }));

        setAssets((prev) => [...prev, ...rows]);
    };

    const removeAsset = (index: number) => {
        setAssets((prev) => prev.filter((_, i) => i !== index));
        setSelected(null);
    };

    const toggleTier = (tier: string) => {
        setData(
            'available_for',
            data.available_for.includes(tier)
                ? data.available_for.filter((t) => t !== tier)
                : [...data.available_for, tier],
        );
    };

    // --- Drag to position an asset on the canvas ---
    const startDrag = (e: React.PointerEvent, index: number) => {
        e.preventDefault();
        setSelected(index);
        const canvas = canvasRef.current;

        if (!canvas) {
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const asset = assets[index];
        const assetLeft = rect.left + (asset.position_x / 100) * rect.width;
        const assetTop = rect.top + (asset.position_y / 100) * rect.height;
        dragRef.current = {
            index,
            offX: e.clientX - assetLeft,
            offY: e.clientY - assetTop,
        };

        const move = (ev: PointerEvent) => {
            const drag = dragRef.current;

            if (!drag) {
                return;
            }

            const r = canvas.getBoundingClientRect();
            const x = ((ev.clientX - drag.offX - r.left) / r.width) * 100;
            const y = ((ev.clientY - drag.offY - r.top) / r.height) * 100;
            updateAsset(drag.index, {
                position_x: round1(clamp(x, 0, 100)),
                position_y: round1(clamp(y, 0, 100)),
            });
        };
        const up = () => {
            dragRef.current = null;
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    };

    // Assets tagged with a stable data-asset key for GSAP targeting.
    const renderable = assets.map((a, i) => ({ ...a, key: a.id ?? -(i + 1) }));

    // The single master timeline that powers Play/Stop and seeking.
    const tlRef = useRef<gsap.core.Timeline | null>(null);

    useEffect(
        () => () => {
            tlRef.current?.kill();
        },
        [],
    );

    // Return every asset to its configured resting position/opacity.
    const resetAssets = () => {
        const canvas = canvasRef.current;

        if (!canvas) {
            return;
        }

        renderable.forEach((a) => {
            const el = canvas.querySelector<HTMLElement>(
                `[data-asset="${a.key}"]`,
            );

            if (el) {
                el.style.transform = '';
                el.style.opacity = String(a.opacity);
            }
        });
    };

    const killTimeline = () => {
        tlRef.current?.kill();
        tlRef.current = null;
    };

    const buildTl = (): gsap.core.Timeline | null => {
        const canvas = canvasRef.current;

        if (!canvas) {
            return null;
        }

        killTimeline();
        const tl = buildTimeline(
            canvas,
            renderable.map((a) => ({
                ...a,
                id: a.key,
            })) as unknown as AnimationAsset[],
        );
        tl.eventCallback('onUpdate', () => paintProgress(tl.progress()));
        tlRef.current = tl;

        return tl;
    };

    const handlePlay = () => {
        const tl = buildTl();

        if (!tl) {
            return;
        }

        tl.play(0);
        setPlaying(true);
    };

    const handleStop = () => {
        killTimeline();
        resetAssets();
        paintProgress(0);
        setPlaying(false);
    };

    // Scrub the master timeline to a fraction of its loop (builds it if needed).
    const seekTo = (fraction: number) => {
        const frac = clamp(fraction, 0, 1);
        const tl = tlRef.current ?? buildTl();

        if (!tl) {
            return;
        }

        tl.pause();
        tl.progress(frac);
        paintProgress(frac);
        setPlaying(false);
    };

    const startSeek = (e: React.PointerEvent) => {
        if (assets.length === 0) {
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const at = (clientX: number) => (clientX - rect.left) / rect.width;
        seekTo(at(e.clientX));

        const move = (ev: PointerEvent) => seekTo(at(ev.clientX));
        const up = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    };

    const captureThumbnail = async (): Promise<File | null> => {
        const canvas = canvasRef.current;

        if (!canvas) {
            return null;
        }

        // Freeze motion so the capture shows assets at their resting position.
        killTimeline();
        resetAssets();
        setPlaying(false);
        paintProgress(0);

        try {
            const shot = await html2canvas(canvas, {
                backgroundColor: null,
                useCORS: true,
                scale: 0.5,
            });
            const blob = await new Promise<Blob | null>((resolve) =>
                shot.toBlob(resolve, 'image/png'),
            );

            return blob
                ? new File([blob], 'thumbnail.png', { type: 'image/png' })
                : null;
        } catch {
            // Tainted canvas (remote assets) — backend falls back to first asset.
            return null;
        }
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();

        const thumbnail = await captureThumbnail();

        const existing = assets.filter((a) => a.id !== null);
        const fresh = assets.filter((a) => a.id === null);
        const params = (a: AssetRow) => ({
            motion_type: a.motion_type,
            position_x: a.position_x,
            position_y: a.position_y,
            width_percent: a.width_percent,
            opacity: a.opacity,
            duration_ms: a.duration_ms,
            delay_ms: a.delay_ms,
            z_index: a.z_index,
        });

        form.transform(() => {
            const base = isEdit
                ? {
                      ...data,
                      assets: existing.map((a) => ({ id: a.id, ...params(a) })),
                      new_assets: fresh.map((a) => ({
                          file: a.file,
                          ...params(a),
                      })),
                  }
                : {
                      ...data,
                      assets: fresh.map((a) => ({
                          file: a.file,
                          ...params(a),
                      })),
                  };

            return thumbnail ? { ...base, thumbnail } : base;
        });

        const url = isEdit
            ? admin.animationPacks.update(pack!.slug).url
            : admin.animationPacks.store().url;

        form.post(url, { forceFormData: true, preserveScroll: true });
    };

    const active = selected !== null ? assets[selected] : null;

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

                <form
                    onSubmit={submit}
                    className="grid gap-6 lg:grid-cols-[280px_1fr_260px]"
                >
                    {/* Left: meta + library */}
                    <div className="flex flex-col gap-6">
                        <Card>
                            <CardContent className="grid gap-4 pt-6">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="name">Nama Pack</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        placeholder="Pink Cherry Blossom"
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
                                            setData(
                                                'section',
                                                e.target
                                                    .value as AnimationPackSectionType,
                                            )
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
                                <div className="grid gap-1.5">
                                    <Label>Tersedia untuk paket</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {packages.map((pkg) => (
                                            <label
                                                key={pkg.value}
                                                className="flex items-center gap-1.5 text-sm"
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
                                <label className="flex items-center gap-2 text-sm">
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
                                    Aktif
                                </label>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="flex flex-col gap-3 pt-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="font-medium">
                                        Library ({assets.length}/10)
                                    </h2>
                                </div>
                                <label
                                    className={cn(
                                        'flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed py-3 text-sm text-muted-foreground hover:bg-muted',
                                        assets.length >= 10 &&
                                            'pointer-events-none opacity-50',
                                    )}
                                >
                                    <Upload className="size-4" /> Upload PNG
                                    <input
                                        type="file"
                                        accept="image/png,image/webp"
                                        multiple
                                        hidden
                                        onChange={(e) =>
                                            addFiles(e.target.files)
                                        }
                                    />
                                </label>
                                {assetError && (
                                    <p className="text-xs text-destructive">
                                        {assetError}
                                    </p>
                                )}
                                <div className="grid grid-cols-4 gap-2">
                                    {renderable.map((asset, index) => (
                                        <button
                                            key={asset.key}
                                            type="button"
                                            onClick={() => setSelected(index)}
                                            className={cn(
                                                'aspect-square overflow-hidden rounded border bg-muted',
                                                selected === index &&
                                                    'ring-2 ring-brand',
                                            )}
                                        >
                                            {asset.preview_url && (
                                                <img
                                                    src={asset.preview_url}
                                                    alt=""
                                                    className="size-full object-contain"
                                                />
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Seret aset di canvas untuk mengatur posisi.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Center: canvas */}
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 pt-6">
                            <div className="flex w-full items-center justify-between">
                                <h2 className="font-medium">Canvas</h2>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={playing ? handleStop : handlePlay}
                                    disabled={assets.length === 0}
                                >
                                    {playing ? (
                                        <>
                                            <Pause className="size-4" /> Stop
                                        </>
                                    ) : (
                                        <>
                                            <Play className="size-4" /> Play
                                        </>
                                    )}
                                </Button>
                            </div>
                            <div
                                ref={canvasRef}
                                className="relative aspect-[9/16] w-full max-w-xs overflow-hidden rounded-xl"
                                style={{ background: SECTION_BG[data.section] }}
                            >
                                {renderable.map((asset, index) => (
                                    <img
                                        key={asset.key}
                                        data-asset={asset.key}
                                        src={asset.preview_url}
                                        alt=""
                                        draggable={false}
                                        onPointerDown={(e) =>
                                            startDrag(e, index)
                                        }
                                        className={cn(
                                            'absolute cursor-move will-change-transform select-none',
                                            selected === index &&
                                                'outline outline-2 outline-brand',
                                        )}
                                        style={{
                                            left: `${asset.position_x}%`,
                                            top: `${asset.position_y}%`,
                                            width: `${asset.width_percent}%`,
                                            opacity: asset.opacity,
                                            zIndex: asset.z_index,
                                            touchAction: 'none',
                                        }}
                                    />
                                ))}
                                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                                    <p className="text-[9px] tracking-[0.25em] text-white/70 uppercase mix-blend-difference">
                                        The Wedding of
                                    </p>
                                    <p className="font-serif text-lg text-white/90 mix-blend-difference">
                                        Rina &amp; Budi
                                    </p>
                                </div>
                            </div>

                            {/* Video-style seekable duration bar (one loop) */}
                            <div className="w-full max-w-xs">
                                <div
                                    onPointerDown={startSeek}
                                    className={cn(
                                        'relative h-4 w-full touch-none select-none',
                                        assets.length === 0
                                            ? 'cursor-not-allowed opacity-50'
                                            : 'cursor-pointer',
                                    )}
                                >
                                    <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 overflow-hidden rounded-full bg-muted">
                                        <div
                                            ref={progressFillRef}
                                            className="h-full w-0 rounded-full bg-brand dark:bg-gold"
                                        />
                                    </div>
                                    <div
                                        ref={progressHandleRef}
                                        className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-brand shadow dark:bg-gold"
                                        style={{ left: '0%' }}
                                    />
                                </div>
                                <div className="mt-1 flex justify-between text-xs text-muted-foreground tabular-nums">
                                    <span ref={progressTimeRef}>0.0s</span>
                                    <span>
                                        {cycleSec > 0
                                            ? `${cycleSec.toFixed(1)}s / loop`
                                            : '—'}
                                    </span>
                                </div>
                            </div>

                            <Button type="submit" disabled={processing}>
                                {isEdit ? 'Simpan Perubahan' : 'Buat Pack'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Right: properties */}
                    <Card>
                        <CardContent className="pt-6">
                            <h2 className="mb-3 font-medium">Properties</h2>
                            {active === null || selected === null ? (
                                <p className="text-sm text-muted-foreground">
                                    Klik aset di canvas atau library untuk
                                    mengatur motion & timing.
                                </p>
                            ) : (
                                <div className="grid gap-3">
                                    <div className="size-16 overflow-hidden rounded border bg-muted">
                                        {active.preview_url && (
                                            <img
                                                src={active.preview_url}
                                                alt=""
                                                className="size-full object-contain"
                                            />
                                        )}
                                    </div>
                                    <div className="grid gap-1">
                                        <Label className="text-xs">
                                            Motion
                                        </Label>
                                        <select
                                            value={active.motion_type}
                                            onChange={(e) =>
                                                updateAsset(selected, {
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
                                                    active[field.key] as number
                                                }
                                                onChange={(e) =>
                                                    updateAsset(selected, {
                                                        [field.key]: Number(
                                                            e.target.value,
                                                        ),
                                                    })
                                                }
                                            />
                                        </div>
                                    ))}
                                    <p className="text-xs text-muted-foreground">
                                        Posisi: {active.position_x}% ,{' '}
                                        {active.position_y}% (seret di canvas)
                                    </p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive"
                                        onClick={() => removeAsset(selected)}
                                    >
                                        <Trash2 className="size-4" /> Hapus aset
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </form>
            </div>
        </>
    );
}

AnimationPackForm.layout = () => ({
    breadcrumbs: [
        { title: 'Admin', href: admin.dashboard().url },
        { title: 'Animation Packs', href: admin.animationPacks.index().url },
    ],
});
