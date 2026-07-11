import { useEffect, useRef, useState } from 'react';

/**
 * Reveal an element the first time it scrolls into view. Returns a ref to
 * attach and a `visible` flag that flips to true once (and stays true). Falls
 * back to immediately visible when IntersectionObserver is unavailable (SSR).
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
    options?: IntersectionObserverInit,
) {
    const ref = useRef<T>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;

        if (!element) {
            return;
        }

        if (typeof IntersectionObserver === 'undefined') {
            setVisible(true);

            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15, ...options },
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    return { ref, visible };
}
