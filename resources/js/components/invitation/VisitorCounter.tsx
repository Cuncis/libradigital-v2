import { Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getJson, postJson } from '@/lib/api';

/** Stable per-browser visitor id used for 24h dedup on the server. */
function getVisitorId(): string {
    const key = 'libradigital_visitor_id';
    let id = localStorage.getItem(key);

    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(key, id);
    }

    return id;
}

export default function VisitorCounter({ slug }: { slug: string }) {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        let active = true;

        postJson<{ count: number }>(`/undangan/${slug}/visit`, {
            session_id: getVisitorId(),
        })
            .then((res) => active && setCount(res.data.count))
            .catch(() => {});

        const poll = setInterval(() => {
            getJson<{ count: number }>(`/undangan/${slug}/visitors`)
                .then((res) => active && setCount(res.data.count))
                .catch(() => {});
        }, 30_000);

        return () => {
            active = false;
            clearInterval(poll);
        };
    }, [slug]);

    return (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Eye className="size-4" />
            <span>
                <strong className="tabular-nums">{count ?? '—'}</strong> tamu
                telah membuka undangan ini
            </span>
        </div>
    );
}
