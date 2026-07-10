/**
 * Datetimes are stored as the couple's local wall-clock time. We format the
 * raw components (timeZone: 'UTC') and append the WIB/WITA/WIT label so the
 * displayed value matches exactly what was entered in the builder.
 */

export function formatIndoDate(iso: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(new Date(iso));
}

export function formatIndoTime(iso: string, tzLabel: string): string {
    const time = new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
    }).format(new Date(iso));

    return `${time} ${tzLabel}`;
}
