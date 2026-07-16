import type {
    Animation,
    AnimationEffect,
    PackageTier,
} from '@/types/invitation';

export interface CoverAnimation {
    /** Utility class applied to the cover when it exits. */
    exit: string;
    /** How long to keep the cover mounted so its exit can finish (ms). */
    durationMs: number;
    /** Number of petals gently falling while the cover is shown (0 = none). */
    petals: number;
    /** Burst of confetti when the guest taps open (richest tiers only). */
    confetti: boolean;
    /** Soft pulsing glow behind the couple's names. */
    glow: boolean;
    /** Shimmering sweep across the "Buka Undangan" button. */
    shimmer: boolean;
}

/**
 * Opening animation per package tier - richer the higher the tier climbs, so a
 * pricier package feels more premium the moment the invitation is opened.
 */
const COVER_ANIMATIONS: Record<PackageTier, CoverAnimation> = {
    starter: {
        exit: 'inv-exit-fade',
        durationMs: 700,
        petals: 0,
        confetti: false,
        glow: false,
        shimmer: false,
    },
    standard: {
        exit: 'inv-exit-slide',
        durationMs: 900,
        petals: 0,
        confetti: false,
        glow: false,
        shimmer: false,
    },
    premium: {
        exit: 'inv-exit-zoom',
        durationMs: 1100,
        petals: 10,
        confetti: false,
        glow: true,
        shimmer: true,
    },
    signature: {
        exit: 'inv-exit-zoom',
        durationMs: 1300,
        petals: 18,
        confetti: true,
        glow: true,
        shimmer: true,
    },
};

export function resolveCoverAnimation(
    tier: PackageTier | null,
): CoverAnimation {
    return COVER_ANIMATIONS[tier ?? 'starter'] ?? COVER_ANIMATIONS.starter;
}

/**
 * How the cover physically leaves the screen. A couple's chosen cover animation
 * overrides the package-tier default; curtain/doors need an uploaded asset and
 * gracefully degrade to a slide when none is present.
 */
export interface CoverEffect {
    kind: 'exit' | 'curtain';
    /** Exit utility class when kind === 'exit'. */
    exit: string;
    /** Curtain sub-style when kind === 'curtain'. */
    effect?: AnimationEffect;
    assetUrl?: string | null;
    durationMs: number;
}

export function resolveCoverEffect(
    animation: Pick<Animation, 'effect' | 'asset_url'> | null | undefined,
    tier: PackageTier | null,
): CoverEffect {
    const base = resolveCoverAnimation(tier);

    switch (animation?.effect) {
        case 'curtain_split':
        case 'doors':
            return animation.asset_url
                ? {
                      kind: 'curtain',
                      exit: 'inv-exit-fade',
                      effect: animation.effect,
                      assetUrl: animation.asset_url,
                      durationMs: 1400,
                  }
                : { kind: 'exit', exit: 'inv-exit-slide', durationMs: 900 };
        case 'cover_fade':
            return { kind: 'exit', exit: 'inv-exit-fade', durationMs: 700 };
        case 'cover_slide_up':
            return { kind: 'exit', exit: 'inv-exit-slide', durationMs: 900 };
        case 'cover_zoom':
            return { kind: 'exit', exit: 'inv-exit-zoom', durationMs: 1000 };
        default:
            return {
                kind: 'exit',
                exit: base.exit,
                durationMs: base.durationMs,
            };
    }
}
