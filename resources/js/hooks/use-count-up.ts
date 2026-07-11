import { useEffect, useState } from 'react';

interface Options {
    duration?: number;
    decimals?: number;
}

function prefersReducedMotion(): boolean {
    return (
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
}

/**
 * Animate a number from 0 to `target` once `start` becomes true, easing out.
 * Returns the value formatted with Indonesian grouping (or fixed decimals).
 * Honours reduced-motion by jumping straight to the final value.
 */
export function useCountUp(
    target: number,
    start: boolean,
    { duration = 1500, decimals = 0 }: Options = {},
): string {
    const [value, setValue] = useState(0);

    useEffect(() => {
        if (!start) {
            return;
        }

        if (prefersReducedMotion()) {
            setValue(target);

            return;
        }

        let frame: number;
        const startedAt = performance.now();

        const tick = (now: number) => {
            const progress = Math.min(1, (now - startedAt) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(target * eased);

            if (progress < 1) {
                frame = requestAnimationFrame(tick);
            }
        };

        frame = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(frame);
    }, [start, target, duration]);

    return decimals > 0
        ? value.toFixed(decimals)
        : Math.round(value).toLocaleString('id-ID');
}
