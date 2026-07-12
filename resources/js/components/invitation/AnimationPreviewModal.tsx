import { useGSAP } from '@gsap/react';
import { X } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { playAll } from '@/lib/animation-motions';
import type { AnimationPack } from '@/types/invitation';

/**
 * Live GSAP preview of an animation pack inside a phone-shaped frame, using the
 * couple's own names and date. Confirms the pack or closes without changes.
 */
export default function AnimationPreviewModal({
    pack,
    brideName,
    groomName,
    dateLabel,
    onConfirm,
    onClose,
}: {
    pack: AnimationPack;
    brideName: string;
    groomName: string;
    dateLabel: string;
    onConfirm: (slug: string) => void;
    onClose: () => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const assets = pack.assets ?? [];

    useGSAP(
        () => {
            if (containerRef.current && assets.length > 0) {
                playAll(containerRef.current, assets);
            }
        },
        { scope: containerRef },
    );

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span>✨</span>
                        <span className="text-sm font-semibold text-stone-800">
                            {pack.name}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex size-7 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <div
                    ref={containerRef}
                    className="relative h-72 overflow-hidden"
                    style={{
                        background:
                            'linear-gradient(135deg, #fdf4f7 0%, #fce8ef 50%, #f9dde7 100%)',
                    }}
                >
                    {assets.map((asset) => (
                        <img
                            key={asset.id}
                            data-asset={asset.id}
                            src={asset.asset_url}
                            alt=""
                            draggable={false}
                            className="pointer-events-none absolute will-change-transform select-none"
                            style={{
                                left: `${asset.position_x}%`,
                                top: `${asset.position_y}%`,
                                width: `${asset.width_percent}%`,
                                opacity: asset.opacity,
                                zIndex: asset.z_index,
                            }}
                        />
                    ))}

                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center">
                        <p className="mb-2 text-[10px] font-medium tracking-[0.25em] text-rose-400 uppercase">
                            The Wedding of
                        </p>
                        <h2 className="font-serif text-xl leading-tight text-stone-800">
                            {brideName}
                            <br />
                            <span className="font-sans text-sm text-stone-400">
                                &amp;
                            </span>
                            <br />
                            {groomName}
                        </h2>
                        <div className="my-2 h-px w-8 bg-rose-300" />
                        <p className="text-xs text-stone-500">{dateLabel}</p>
                    </div>
                </div>

                <div className="border-y border-amber-100 bg-amber-50 px-4 py-2 text-center">
                    <p className="text-xs text-amber-700">
                        📱 Simulasi tampilan di HP tamu · animasi berjalan
                    </p>
                </div>

                <div className="flex gap-2 p-4">
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={onClose}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        className="flex-1"
                        onClick={() => {
                            onConfirm(pack.slug);
                            onClose();
                        }}
                    >
                        ✓ Pakai Animasi Ini
                    </Button>
                </div>
            </div>
        </div>
    );
}
