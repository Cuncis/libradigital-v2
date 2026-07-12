import { MailOpen } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useHydrated } from '@/hooks/use-hydrated';
import type { CoverAnimation } from '@/lib/cover-animation';
import {
    resolveCoverAnimation,
    resolveCoverEffect,
} from '@/lib/cover-animation';
import { formatIndoDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Animation, PackageTier } from '@/types/invitation';

const CONFETTI_COLORS = ['#ffbb05', '#f43f5e', '#38bdf8', '#a855f7', '#22c55e'];

/**
 * Random particle sets are built once per mount via a lazy state initializer
 * (impure work is allowed there, not in render / useMemo). The tier — and thus
 * the counts — never change while mounted, so the initial set is stable.
 */
function usePetals(count: number) {
    const [petals] = useState(() =>
        Array.from({ length: count }, () => ({
            left: Math.random() * 100,
            delay: Math.random() * 8,
            duration: 7 + Math.random() * 6,
            size: 10 + Math.random() * 12,
            opacity: 0.4 + Math.random() * 0.5,
        })),
    );

    return petals;
}

function useConfetti(enabled: boolean) {
    const [confetti] = useState(() =>
        enabled
            ? Array.from({ length: 40 }, (_, i) => ({
                  left: Math.random() * 100,
                  delay: Math.random() * 0.4,
                  duration: 1 + Math.random() * 0.9,
                  size: 6 + Math.random() * 6,
                  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                  rounded: Math.random() > 0.5,
              }))
            : [],
    );

    return confetti;
}

/**
 * Full-screen "envelope" cover shown before the invitation is revealed. Clicking
 * "Buka Undangan" plays a package-tiered opening animation, then calls
 * {@link onOpen} so the parent can unlock scrolling (and start music, etc.).
 */
export default function InvitationCover({
    tier,
    animation,
    coverPhoto,
    groomName,
    brideName,
    weddingDate,
    guestName,
    ornament,
    onOpen,
}: {
    tier: PackageTier | null;
    animation?: Animation | null;
    coverPhoto: string | null;
    groomName: string | null;
    brideName: string | null;
    weddingDate: string | null;
    guestName: string;
    ornament: string;
    onOpen: () => void;
}) {
    const anim: CoverAnimation = resolveCoverAnimation(tier);
    const cover = resolveCoverEffect(animation, tier);
    const hydrated = useHydrated();
    const [opening, setOpening] = useState(false);

    const petals = usePetals(anim.petals);
    const confetti = useConfetti(anim.confetti);

    const handleOpen = () => {
        if (opening) {
            return;
        }

        setOpening(true);
        onOpen();
    };

    const isCurtain = cover.kind === 'curtain';
    const isDoors = cover.effect === 'doors';

    return (
        <div
            className={cn(
                'fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-6 text-center text-white',
                // Curtain fades the whole cover out only after the panels part.
                opening &&
                    (isCurtain
                        ? 'inv-exit-fade [animation-delay:0.9s]'
                        : cover.exit),
            )}
            aria-hidden={opening}
        >
            {coverPhoto ? (
                <img
                    src={coverPhoto}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--inv-accent-strong)] to-black" />
            )}
            <div className="absolute inset-0 bg-black/55" />

            {/* Curtain / doors panels built from the uploaded asset. */}
            {isCurtain && cover.assetUrl && (
                <div className="pointer-events-none absolute inset-0 z-[5] flex [perspective:1200px]">
                    <div
                        className={cn(
                            'h-full w-1/2 bg-cover bg-left bg-no-repeat transition-transform duration-[1200ms] ease-in-out',
                            isDoors && 'origin-left',
                            opening &&
                                (isDoors
                                    ? '[transform:rotateY(-105deg)]'
                                    : '-translate-x-full'),
                        )}
                        style={{ backgroundImage: `url(${cover.assetUrl})` }}
                    />
                    <div
                        className={cn(
                            'h-full w-1/2 bg-cover bg-right bg-no-repeat transition-transform duration-[1200ms] ease-in-out',
                            isDoors && 'origin-right',
                            opening &&
                                (isDoors
                                    ? '[transform:rotateY(105deg)]'
                                    : 'translate-x-full'),
                        )}
                        style={{ backgroundImage: `url(${cover.assetUrl})` }}
                    />
                </div>
            )}

            {/* Idle falling petals (higher tiers). */}
            {hydrated && !opening && anim.petals > 0 && (
                <div
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                    aria-hidden
                >
                    {petals.map((petal, i) => (
                        <span
                            key={i}
                            className="inv-petal absolute top-0 text-[var(--inv-accent)]"
                            style={{
                                left: `${petal.left}%`,
                                fontSize: `${petal.size}px`,
                                opacity: petal.opacity,
                                animationDelay: `${petal.delay}s`,
                                animationDuration: `${petal.duration}s`,
                            }}
                        >
                            ❀
                        </span>
                    ))}
                </div>
            )}

            {/* Confetti burst on open (top tier). */}
            {hydrated && opening && confetti.length > 0 && (
                <div
                    className="pointer-events-none absolute inset-0 overflow-hidden"
                    aria-hidden
                >
                    {confetti.map((piece, i) => (
                        <span
                            key={i}
                            className={cn(
                                'inv-confetti absolute top-0 block',
                                piece.rounded
                                    ? 'rounded-full'
                                    : 'rounded-[2px]',
                            )}
                            style={
                                {
                                    left: `${piece.left}%`,
                                    width: `${piece.size}px`,
                                    height: `${piece.size}px`,
                                    backgroundColor: piece.color,
                                    animationDelay: `${piece.delay}s`,
                                    animationDuration: `${piece.duration}s`,
                                } as CSSProperties
                            }
                        />
                    ))}
                </div>
            )}

            <div className="relative z-10 flex flex-col items-center">
                <p className="text-sm tracking-[0.3em] uppercase">
                    The Wedding Of
                </p>
                <div className="relative mt-4">
                    {anim.glow && (
                        <span
                            className="inv-glow absolute -inset-6 -z-10 rounded-full bg-[var(--inv-accent)]/40 blur-3xl"
                            aria-hidden
                        />
                    )}
                    <h1 className="[font-family:var(--inv-font-heading)] text-5xl font-semibold sm:text-6xl">
                        {groomName}
                        <span className="mx-3 text-white/70">&amp;</span>
                        {brideName}
                    </h1>
                </div>
                <p className="mt-4 text-2xl text-white/80">{ornament}</p>
                {weddingDate && (
                    <p className="mt-3 text-lg text-white/90">
                        {formatIndoDate(weddingDate)}
                    </p>
                )}

                {guestName && (
                    <div className="mt-8 rounded-lg bg-white/15 px-6 py-3 backdrop-blur">
                        <p className="text-sm">Kepada Bapak/Ibu/Saudara/i</p>
                        <p className="font-serif text-xl">{guestName}</p>
                    </div>
                )}

                <Button
                    type="button"
                    size="lg"
                    onClick={handleOpen}
                    className="relative mt-10 overflow-hidden bg-white/95 text-neutral-900 shadow-lg hover:bg-white"
                >
                    {anim.shimmer && (
                        <span
                            className="inv-shimmer pointer-events-none absolute inset-0"
                            aria-hidden
                        />
                    )}
                    <MailOpen className="size-4" /> Buka Undangan
                </Button>
            </div>
        </div>
    );
}
