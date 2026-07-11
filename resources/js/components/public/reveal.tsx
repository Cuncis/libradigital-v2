import type { ReactNode } from 'react';
import { useReveal } from '@/hooks/use-reveal';
import { cn } from '@/lib/utils';

interface RevealProps {
    children: ReactNode;
    className?: string;
    /** Delay in ms before the transition starts (for staggering). */
    delay?: number;
}

/**
 * Fades and slides its children up the first time they enter the viewport.
 * Respects reduced-motion (renders in its final state immediately).
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
    const { ref, visible } = useReveal();

    return (
        <div
            ref={ref}
            style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
            className={cn(
                'transition-all duration-700 ease-out motion-reduce:!translate-y-0 motion-reduce:!opacity-100 motion-reduce:transition-none',
                visible
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-6 opacity-0',
                className,
            )}
        >
            {children}
        </div>
    );
}
