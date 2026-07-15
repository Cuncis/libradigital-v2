import { CalendarHeart, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatIndoDate, formatIndoTime } from '@/lib/format';

/**
 * A single ceremony card (Akad or Resepsi). Datetime is treated as wall-clock
 * (see lib/format), labelled with the invitation's WIB/WITA/WIT timezone.
 */
export default function EventBlock({
    title,
    datetime,
    tz,
    venue,
    address,
    mapsUrl,
}: {
    title: string;
    datetime: string | null;
    tz: string;
    venue: string | null;
    address: string | null;
    mapsUrl: string | null;
}) {
    return (
        <div className="rounded-2xl border border-[var(--inv-card-border)] bg-[var(--inv-card-bg)] p-8">
            <CalendarHeart className="mx-auto size-8 text-[var(--inv-accent)]" />
            <h3 className="mt-3 [font-family:var(--inv-font-heading)] text-2xl">
                {title}
            </h3>
            {datetime && (
                <>
                    <p className="mt-3 text-lg">{formatIndoDate(datetime)}</p>
                    <p className="text-muted-foreground">
                        {formatIndoTime(datetime, tz)} - selesai
                    </p>
                </>
            )}
            {venue && <p className="mt-4 font-medium">{venue}</p>}
            {address && (
                <p className="text-sm text-muted-foreground">{address}</p>
            )}
            {mapsUrl && (
                <Button
                    asChild
                    variant="outline"
                    className="mt-5 h-11 w-full whitespace-normal sm:h-9 sm:w-auto"
                >
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                        <MapPin className="size-4 shrink-0" /> Buka di Google
                        Maps
                    </a>
                </Button>
            )}
        </div>
    );
}
