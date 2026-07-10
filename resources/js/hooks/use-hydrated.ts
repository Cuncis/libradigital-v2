import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Returns false during server render and the first client render, then true once
 * hydrated. Lets components defer client-only reads (window, live time) without
 * triggering an SSR hydration mismatch.
 */
export function useHydrated(): boolean {
    return useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false,
    );
}
