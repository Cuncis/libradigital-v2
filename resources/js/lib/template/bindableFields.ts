/**
 * Template Builder — bindable fields, render context, and value/visibility
 * resolution (§5, §7 of TEMPLATE_BUILDER.md).
 *
 * The field whitelist is derived 1:1 from `PublicInvitation` / `InvitationResource`.
 * Scalars only — arrays are owned by repeater widgets, not text bindings.
 */
import { formatIndoDate, formatIndoTime } from '@/lib/format';
import type { PublicInvitation } from '@/types/invitation';
import type { BindFormat, RepeaterSource, Value, Visibility } from './nodes';

export type BindableField =
    // couple + date
    | 'groom_name'
    | 'bride_name'
    | 'wedding_date'
    // akad
    | 'akad_venue'
    | 'akad_address'
    | 'akad_datetime'
    | 'maps_url_akad'
    // resepsi
    | 'resepsi_venue'
    | 'resepsi_address'
    | 'resepsi_datetime'
    | 'maps_url_resepsi'
    // media + prose
    | 'cover_photo'
    | 'love_story'
    | 'music_url'
    // context (runtime, not invitation columns)
    | 'ctx.slug';

export type FieldGroup = 'Pasangan' | 'Akad' | 'Resepsi' | 'Media' | 'Konteks';

export interface BindableFieldMeta {
    field: BindableField;
    label: string;
    group: FieldGroup;
    /** Suggested format the builder pre-fills when binding this field into text. */
    defaultFormat?: BindFormat;
    /** Placeholder shown when the field is empty (draft previews). */
    placeholder: string;
}

export const BINDABLE_FIELDS: BindableFieldMeta[] = [
    {
        field: 'groom_name',
        label: 'Nama Pria',
        group: 'Pasangan',
        placeholder: 'Nama Pengantin',
    },
    {
        field: 'bride_name',
        label: 'Nama Wanita',
        group: 'Pasangan',
        placeholder: 'Nama Pengantin',
    },
    {
        field: 'wedding_date',
        label: 'Tanggal Pernikahan',
        group: 'Pasangan',
        defaultFormat: 'date',
        placeholder: '00 Bulan 0000',
    },
    {
        field: 'akad_venue',
        label: 'Lokasi Akad',
        group: 'Akad',
        placeholder: 'Lokasi Akad',
    },
    {
        field: 'akad_address',
        label: 'Alamat Akad',
        group: 'Akad',
        placeholder: '',
    },
    {
        field: 'akad_datetime',
        label: 'Waktu Akad',
        group: 'Akad',
        defaultFormat: 'datetime',
        placeholder: '',
    },
    {
        field: 'maps_url_akad',
        label: 'Google Maps Akad',
        group: 'Akad',
        placeholder: '',
    },
    {
        field: 'resepsi_venue',
        label: 'Lokasi Resepsi',
        group: 'Resepsi',
        placeholder: 'Lokasi Resepsi',
    },
    {
        field: 'resepsi_address',
        label: 'Alamat Resepsi',
        group: 'Resepsi',
        placeholder: '',
    },
    {
        field: 'resepsi_datetime',
        label: 'Waktu Resepsi',
        group: 'Resepsi',
        defaultFormat: 'datetime',
        placeholder: '',
    },
    {
        field: 'maps_url_resepsi',
        label: 'Google Maps Resepsi',
        group: 'Resepsi',
        placeholder: '',
    },
    {
        field: 'cover_photo',
        label: 'Foto Sampul',
        group: 'Media',
        placeholder: '',
    },
    {
        field: 'love_story',
        label: 'Kisah Cinta',
        group: 'Media',
        placeholder: '',
    },
    {
        field: 'music_url',
        label: 'Musik Latar',
        group: 'Media',
        placeholder: '',
    },
    {
        field: 'ctx.slug',
        label: 'Slug Undangan',
        group: 'Konteks',
        placeholder: '',
    },
];

const FALLBACK_BY_FIELD: Record<BindableField, string> = Object.fromEntries(
    BINDABLE_FIELDS.map((meta) => [meta.field, meta.placeholder]),
) as Record<BindableField, string>;

/**
 * Everything the renderer needs to resolve a tree. `guestName`/`hydrated` back
 * the `guest_greeting` widget (§6.4) — no text node reads them directly.
 */
export interface RenderContext {
    invitation: PublicInvitation;
    guestName: string;
    hydrated: boolean;
}

/** Raw field value (unformatted), or null when absent. */
function readField(ctx: RenderContext, field: BindableField): string | null {
    if (field === 'ctx.slug') {
        return ctx.invitation.slug;
    }

    return ctx.invitation[field] ?? null;
}

function applyFormat(raw: string, format: BindFormat, tz: string): string {
    switch (format) {
        case 'date':
            return formatIndoDate(raw);
        case 'time':
            return formatIndoTime(raw, tz);
        case 'datetime':
            return `${formatIndoDate(raw)}, ${formatIndoTime(raw, tz)}`;
    }
}

/** Resolve a Value to its display string (§5). */
export function resolveValue(value: Value, ctx: RenderContext): string {
    switch (value.kind) {
        case 'literal':
            return value.value;
        case 'template':
            return value.parts.map((part) => resolveValue(part, ctx)).join('');
        case 'bind': {
            const raw = readField(ctx, value.field);

            if (raw === null || raw === '') {
                return value.fallback ?? FALLBACK_BY_FIELD[value.field] ?? '';
            }

            return value.format
                ? applyFormat(raw, value.format, ctx.invitation.timezone)
                : raw;
        }
    }
}

function readArray(ctx: RenderContext, source: RepeaterSource): unknown[] {
    switch (source) {
        case 'gallery_photos':
            return ctx.invitation.gallery_photos;
        case 'gift_accounts':
            return ctx.invitation.gift_accounts;
        case 'guest_book_entries':
            return ctx.invitation.guest_book_entries ?? [];
    }
}

/** Evaluate a node's `visibleWhen` (§7). Absent/null visibility = always shown. */
export function evalVisibility(
    visibility: Visibility | null | undefined,
    ctx: RenderContext,
): boolean {
    if (!visibility) {
        return true;
    }

    switch (visibility.when) {
        case 'notEmpty': {
            const raw = readField(ctx, visibility.field);

            return raw !== null && raw !== '';
        }
        case 'arrayNotEmpty':
            return readArray(ctx, visibility.source).length > 0;
        case 'addon':
            return ctx.invitation.has_guest_book;
        case 'all':
            return visibility.of.every((entry) => evalVisibility(entry, ctx));
        case 'any':
            return visibility.of.some((entry) => evalVisibility(entry, ctx));
    }
}
