import gsap from 'gsap';
import type { AnimationAsset, MotionType } from '@/types/invitation';

type MotionFn = (
    el: Element,
    cfg: AnimationAsset,
) => gsap.core.Tween | gsap.core.Timeline;

/**
 * Deterministic PRNG (mulberry32) seeded by an asset id, so motions with random
 * offsets (fall-down rotation, drift path) reproduce the exact same values on
 * every rebuild - which keeps scrubbing/seeking stable.
 */
function seededRandom(seed: number): (min: number, max: number) => number {
    let a = (Math.trunc(seed) || 1) >>> 0;

    return (min, max) => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        const unit = ((t ^ (t >>> 14)) >>> 0) / 4294967296;

        return min + unit * (max - min);
    };
}

/**
 * The 10 motion presets. Each maps an asset's timing config to a GSAP tween or
 * timeline. This is the single source of truth for both the public
 * AnimationLayer and the builder preview modal.
 */
export const MOTION_PRESETS: Record<MotionType, MotionFn> = {
    'float-y': (el, cfg) =>
        gsap.to(el, {
            y: -24,
            duration: cfg.duration_ms / 1000,
            repeat: cfg.repeat_count,
            yoyo: true,
            ease: 'sine.inOut',
            delay: cfg.delay_ms / 1000,
        }),

    'float-x': (el, cfg) =>
        gsap.to(el, {
            x: 20,
            duration: cfg.duration_ms / 1000,
            repeat: cfg.repeat_count,
            yoyo: true,
            ease: 'sine.inOut',
            delay: cfg.delay_ms / 1000,
        }),

    'fall-down': (el, cfg) => {
        const rand = seededRandom(cfg.id * 2654435761);

        return gsap.fromTo(
            el,
            { y: -120, opacity: 0, rotate: rand(-20, 20) },
            {
                y: '115vh',
                opacity: cfg.opacity,
                duration: cfg.duration_ms / 1000,
                repeat: cfg.repeat_count,
                ease: 'none',
                delay: cfg.delay_ms / 1000,
            },
        );
    },

    'fall-up': (el, cfg) =>
        gsap.fromTo(
            el,
            { y: '115vh', opacity: 0 },
            {
                y: -120,
                opacity: cfg.opacity,
                duration: cfg.duration_ms / 1000,
                repeat: cfg.repeat_count,
                ease: 'power1.in',
                delay: cfg.delay_ms / 1000,
            },
        ),

    sway: (el, cfg) =>
        gsap.to(el, {
            rotate: 14,
            duration: cfg.duration_ms / 1000,
            repeat: cfg.repeat_count,
            yoyo: true,
            ease: 'sine.inOut',
            transformOrigin: '50% 0%',
            delay: cfg.delay_ms / 1000,
        }),

    breathe: (el, cfg) =>
        gsap.to(el, {
            scale: 1.18,
            duration: cfg.duration_ms / 1000,
            repeat: cfg.repeat_count,
            yoyo: true,
            ease: 'power1.inOut',
            delay: cfg.delay_ms / 1000,
        }),

    spin: (el, cfg) =>
        gsap.to(el, {
            rotate: 360,
            duration: cfg.duration_ms / 1000,
            repeat: cfg.repeat_count,
            ease: 'none',
            delay: cfg.delay_ms / 1000,
        }),

    'spin-slow': (el, cfg) =>
        gsap.to(el, {
            rotate: 360,
            duration: (cfg.duration_ms / 1000) * 5,
            repeat: cfg.repeat_count,
            ease: 'none',
            delay: cfg.delay_ms / 1000,
        }),

    drift: (el, cfg) => {
        const rand = seededRandom(cfg.id * 2654435761);
        const tl = gsap.timeline({
            repeat: cfg.repeat_count,
            delay: cfg.delay_ms / 1000,
        });
        tl.to(el, {
            x: rand(-30, 30),
            y: rand(-20, 20),
            rotate: rand(-15, 15),
            duration: cfg.duration_ms / 1000,
            ease: 'sine.inOut',
        });
        tl.to(el, {
            x: rand(-30, 30),
            y: rand(-20, 20),
            rotate: rand(-15, 15),
            duration: cfg.duration_ms / 1000,
            ease: 'sine.inOut',
        });

        return tl;
    },

    twinkle: (el, cfg) =>
        gsap.to(el, {
            opacity: 0.05,
            duration: cfg.duration_ms / 1000,
            repeat: cfg.repeat_count,
            yoyo: true,
            ease: 'power2.inOut',
            delay: cfg.delay_ms / 1000,
        }),
};

/** Start every asset's motion inside a container. */
export function playAll(
    container: HTMLElement,
    assets: AnimationAsset[],
): void {
    assets.forEach((asset) => {
        const el = container.querySelector(`[data-asset="${asset.id}"]`);

        if (el) {
            MOTION_PRESETS[asset.motion_type]?.(el, asset);
        }
    });
}

/** Kill every asset tween inside a container. */
export function killAll(container: HTMLElement): void {
    gsap.killTweensOf(container.querySelectorAll('[data-asset]'));
}

/**
 * Compose every asset's motion into ONE paused, looping master timeline so it
 * can be scrubbed/seeked (unlike the independent infinite tweens from playAll).
 * The loop length is the longest asset cycle (delay + duration); shorter assets
 * repeat to fill that window so motion stays continuous.
 */
export function buildTimeline(
    container: HTMLElement,
    assets: AnimationAsset[],
): gsap.core.Timeline {
    const cycleSec = Math.max(
        0.001,
        ...assets.map((a) => (a.delay_ms + a.duration_ms) / 1000),
    );

    const tl = gsap.timeline({ repeat: -1, paused: true });

    assets.forEach((asset) => {
        const el = container.querySelector(`[data-asset="${asset.id}"]`);

        if (!el) {
            return;
        }

        const delaySec = asset.delay_ms / 1000;
        const durSec = Math.max(0.001, asset.duration_ms / 1000);
        const windowSec = Math.max(durSec, cycleSec - delaySec);
        const repeat = Math.max(0, Math.floor(windowSec / durSec) - 1);

        // Delay is handled by the timeline position, not the tween itself.
        const child = MOTION_PRESETS[asset.motion_type]?.(el, {
            ...asset,
            delay_ms: 0,
            repeat_count: repeat,
        });

        if (child) {
            tl.add(child, delaySec);
        }
    });

    // Pad the master to exactly one cycle so bar position maps 1:1 to time.
    tl.to({}, { duration: 0 }, cycleSec);

    return tl;
}
