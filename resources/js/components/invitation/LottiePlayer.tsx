import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useHydrated } from '@/hooks/use-hydrated';
import { cn } from '@/lib/utils';

/**
 * Renders a Lottie animation from a `.json`/`.lottie` URL. The player touches the
 * DOM/canvas, so it only mounts after hydration; before that (and when no source
 * is set) it shows a neutral placeholder box so SSR and the first client render
 * agree and the builder still has something to select.
 */
export default function LottiePlayer({
    src,
    loop = true,
    speed = 1,
    className,
}: {
    src: string;
    loop?: boolean;
    speed?: number;
    className?: string;
}) {
    const hydrated = useHydrated();

    if (!hydrated || !src) {
        return (
            <div
                className={cn(
                    'flex aspect-square w-full items-center justify-center rounded-md bg-black/5 text-xs text-muted-foreground',
                    className,
                )}
                aria-hidden
            >
                {src ? '' : 'Lottie'}
            </div>
        );
    }

    return (
        <DotLottieReact
            src={src}
            loop={loop}
            autoplay
            speed={speed}
            className={className}
        />
    );
}
