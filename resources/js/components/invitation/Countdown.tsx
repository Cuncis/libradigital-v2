import { useEffect, useState } from 'react';
import { useHydrated } from '@/hooks/use-hydrated';

interface Remaining {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    passed: boolean;
}

function computeRemaining(target: number): Remaining {
    const diff = target - Date.now();

    if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, passed: true };
    }

    return {
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor((diff / 3_600_000) % 24),
        minutes: Math.floor((diff / 60_000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        passed: false,
    };
}

export default function Countdown({ targetIso }: { targetIso: string }) {
    const target = new Date(targetIso).getTime();
    // The server and first client render show placeholders (hydrated === false);
    // once hydrated we compute the live value and re-render every second via the
    // interval tick. This avoids an SSR hydration mismatch on the digits.
    const hydrated = useHydrated();
    const [, setTick] = useState(0);

    useEffect(() => {
        const id = setInterval(() => setTick((t) => t + 1), 1000);

        return () => clearInterval(id);
    }, []);

    const remaining = hydrated ? computeRemaining(target) : null;

    if (remaining?.passed) {
        return (
            <p className="text-center text-lg font-medium">
                Hari bahagia telah tiba 🤍
            </p>
        );
    }

    const pad = (value: number | undefined) =>
        value === undefined ? '––' : String(value).padStart(2, '0');

    const units: Array<[string, string]> = [
        ['Hari', pad(remaining?.days)],
        ['Jam', pad(remaining?.hours)],
        ['Menit', pad(remaining?.minutes)],
        ['Detik', pad(remaining?.seconds)],
    ];

    return (
        // 4-column grid so the boxes always share the available width and shrink
        // to fit on narrow phones instead of overflowing (min-w-based flex did).
        <div className="mx-auto grid max-w-xs grid-cols-4 gap-2 sm:max-w-sm sm:gap-4">
            {units.map(([label, value]) => (
                <div
                    key={label}
                    className="flex flex-col items-center rounded-xl border border-[var(--inv-card-border)] bg-[var(--inv-card-bg)] px-1 py-3 shadow-sm backdrop-blur sm:px-3"
                >
                    <span className="[font-family:var(--inv-font-heading)] text-2xl font-semibold tabular-nums sm:text-3xl">
                        {value}
                    </span>
                    <span className="mt-1 text-[10px] tracking-wide text-muted-foreground uppercase sm:text-xs">
                        {label}
                    </span>
                </div>
            ))}
        </div>
    );
}
