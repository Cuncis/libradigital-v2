import gsap from 'gsap';
import type { AnimationAsset, MotionType } from '@/types/invitation';

type MotionFn = (
    el: Element,
    cfg: AnimationAsset,
) => gsap.core.Tween | gsap.core.Timeline;

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

    'fall-down': (el, cfg) =>
        gsap.fromTo(
            el,
            { y: -120, opacity: 0, rotate: gsap.utils.random(-20, 20) },
            {
                y: '115vh',
                opacity: cfg.opacity,
                duration: cfg.duration_ms / 1000,
                repeat: cfg.repeat_count,
                ease: 'none',
                delay: cfg.delay_ms / 1000,
            },
        ),

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
        const tl = gsap.timeline({
            repeat: cfg.repeat_count,
            delay: cfg.delay_ms / 1000,
        });
        tl.to(el, {
            x: gsap.utils.random(-30, 30),
            y: gsap.utils.random(-20, 20),
            rotate: gsap.utils.random(-15, 15),
            duration: cfg.duration_ms / 1000,
            ease: 'sine.inOut',
        });
        tl.to(el, {
            x: gsap.utils.random(-30, 30),
            y: gsap.utils.random(-20, 20),
            rotate: gsap.utils.random(-15, 15),
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
