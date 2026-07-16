import { useEffect, useState } from 'react';
import type { Device } from '@/lib/template/nodes';

/** Viewport width (px) at/above which the desktop style layer applies. */
const DESKTOP_MIN_WIDTH = 640;

/**
 * Reports the active device bucket from the viewport width so <TemplateRenderer>
 * can apply per-node `responsive.mobile` overrides on the public page.
 *
 * Returns `undefined` on the first render to match SSR (which has no viewport and
 * therefore renders the desktop/base layer). The real value is set after mount and
 * on every breakpoint crossing, so a mobile visitor's overrides apply immediately.
 */
export function useViewportDevice(): Device | undefined {
    const [device, setDevice] = useState<Device | undefined>(undefined);

    useEffect(() => {
        const query = window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`);
        const update = () => {
            setDevice(query.matches ? 'desktop' : 'mobile');
        };

        update();
        query.addEventListener('change', update);

        return () => {
            query.removeEventListener('change', update);
        };
    }, []);

    return device;
}
