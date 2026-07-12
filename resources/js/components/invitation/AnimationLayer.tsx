import { useGSAP } from '@gsap/react';
import { useRef } from 'react';
import { playAll } from '@/lib/animation-motions';
import type { AnimationPack } from '@/types/invitation';

/**
 * Transparent overlay that floats a pack's PNG assets above a section. It never
 * captures pointer events, so guests can still scroll, tap, and fill the RSVP.
 * Renders nothing when there is no pack or it has no assets.
 */
export default function AnimationLayer({
    pack,
}: {
    pack: AnimationPack | null | undefined;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const assets = pack?.assets ?? [];

    useGSAP(
        () => {
            if (containerRef.current && assets.length > 0) {
                playAll(containerRef.current, assets);
            }
        },
        { scope: containerRef, dependencies: [pack?.slug] },
    );

    if (!pack || assets.length === 0) {
        return null;
    }

    return (
        <div
            ref={containerRef}
            className="pointer-events-none absolute inset-0 overflow-hidden"
            aria-hidden
        >
            {assets.map((asset) => (
                <img
                    key={asset.id}
                    data-asset={asset.id}
                    src={asset.asset_url}
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
        </div>
    );
}
