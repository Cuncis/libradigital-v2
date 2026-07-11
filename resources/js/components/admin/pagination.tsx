import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import type { PaginationLink } from '@/types';

interface PaginationProps {
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
}

export function Pagination({ links, from, to, total }: PaginationProps) {
    if (total === 0) {
        return null;
    }

    return (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
                Menampilkan {from ?? 0}–{to ?? 0} dari {total}
            </p>
            <nav className="flex flex-wrap items-center gap-1">
                {links.map((link, index) => {
                    const label = link.label
                        .replace('&laquo;', '‹')
                        .replace('&raquo;', '›')
                        .replace('pagination.previous', '‹')
                        .replace('pagination.next', '›');

                    const className = cn(
                        'inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm transition-colors',
                        link.active
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-input hover:bg-accent hover:text-accent-foreground',
                        !link.url && 'pointer-events-none opacity-50',
                    );

                    if (!link.url) {
                        return (
                            <span
                                key={index}
                                className={className}
                                dangerouslySetInnerHTML={{ __html: label }}
                            />
                        );
                    }

                    return (
                        <Link
                            key={index}
                            href={link.url}
                            preserveScroll
                            className={className}
                            dangerouslySetInnerHTML={{ __html: label }}
                        />
                    );
                })}
            </nav>
        </div>
    );
}
