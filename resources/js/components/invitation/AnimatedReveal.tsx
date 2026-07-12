import { useReveal } from '@/hooks/use-reveal';
import { cn } from '@/lib/utils';
import type { Animation, AnimationEffect } from '@/types/invitation';

/** [hidden, shown] utility classes per scroll-reveal effect. */
const REVEAL_CLASSES: Partial<Record<AnimationEffect, [string, string]>> = {
    fade: ['opacity-0', 'opacity-100'],
    slide_up: ['translate-y-10 opacity-0', 'translate-y-0 opacity-100'],
    slide_left: ['-translate-x-10 opacity-0', 'translate-x-0 opacity-100'],
    slide_right: ['translate-x-10 opacity-0', 'translate-x-0 opacity-100'],
    zoom: ['scale-95 opacity-0', 'scale-100 opacity-100'],
};

/**
 * Reveals its children the first time they scroll into view, using the couple's
 * chosen animation for the section (falling back to a gentle fade).
 */
export default function AnimatedReveal({
    animation,
    fallback = 'fade',
    className,
    children,
}: {
    animation?: Animation | null;
    fallback?: AnimationEffect;
    className?: string;
    children: React.ReactNode;
}) {
    const { ref, visible } = useReveal<HTMLDivElement>();
    const effect = animation?.effect ?? fallback;
    const [hidden, shown] = REVEAL_CLASSES[effect] ?? REVEAL_CLASSES.fade!;

    return (
        <div
            ref={ref}
            className={cn(
                'transition-all duration-700 ease-out motion-reduce:transition-none',
                visible ? shown : hidden,
                className,
            )}
        >
            {children}
        </div>
    );
}
