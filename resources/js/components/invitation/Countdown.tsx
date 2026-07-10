import { useEffect, useState } from 'react';

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
    const [remaining, setRemaining] = useState(() => computeRemaining(target));

    useEffect(() => {
        const id = setInterval(
            () => setRemaining(computeRemaining(target)),
            1000,
        );

        return () => clearInterval(id);
    }, [target]);

    if (remaining.passed) {
        return (
            <p className="text-center text-lg font-medium">
                Hari bahagia telah tiba 🤍
            </p>
        );
    }

    const units: Array<[string, number]> = [
        ['Hari', remaining.days],
        ['Jam', remaining.hours],
        ['Menit', remaining.minutes],
        ['Detik', remaining.seconds],
    ];

    return (
        <div className="flex justify-center gap-3 sm:gap-4">
            {units.map(([label, value]) => (
                <div
                    key={label}
                    className="flex min-w-[64px] flex-col items-center rounded-xl border border-rose-200/60 bg-white/70 px-3 py-3 shadow-sm backdrop-blur dark:border-rose-900/40 dark:bg-neutral-900/60"
                >
                    <span className="font-serif text-3xl font-semibold tabular-nums">
                        {String(value).padStart(2, '0')}
                    </span>
                    <span className="mt-1 text-xs tracking-wide text-muted-foreground uppercase">
                        {label}
                    </span>
                </div>
            ))}
        </div>
    );
}
