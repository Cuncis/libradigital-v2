/**
 * Template Builder — widget registry (§6 of TEMPLATE_BUILDER.md).
 *
 * Maps a WidgetKind to its existing invitation component + binding contract.
 * The components themselves are unchanged; this only makes them addressable
 * from the node tree. The renderer resolves a node's `bindings` into a
 * Record<string,string> and hands it to `render` alongside the RenderContext.
 */
import type { ReactNode } from 'react';
import Countdown from '@/components/invitation/Countdown';
import EventBlock from '@/components/invitation/EventBlock';
import GiftCard from '@/components/invitation/GiftCard';
import GuestBook from '@/components/invitation/GuestBook';
import LoveStoryTimeline from '@/components/invitation/LoveStoryTimeline';
import RsvpForm from '@/components/invitation/RsvpForm';
import VisitorCounter from '@/components/invitation/VisitorCounter';
import WaShareButton from '@/components/invitation/WaShareButton';
import type { RenderContext } from './bindableFields';
import type { Visibility, WidgetKind } from './nodes';

export interface BindingRule {
    label: string;
    required: boolean;
}

export interface WidgetSpec {
    kind: WidgetKind;
    label: string;
    /** Prop name → rule. Drives the builder's binding panel and save validation. */
    bindingSchema: Record<string, BindingRule>;
    /** True when the widget iterates an invitation array rather than scalar binds. */
    isRepeater: boolean;
    /** Seeded onto a node's `visibleWhen` at creation; the renderer reads the node's. */
    defaultVisibleWhen?: Visibility;
    render: (resolved: Record<string, string>, ctx: RenderContext) => ReactNode;
}

/** Static, non-interactive stand-in shown for live widgets in the builder canvas. */
function PreviewStub({ label }: { label: string }): ReactNode {
    return (
        <div className="rounded-xl border border-dashed border-[var(--inv-card-border)] bg-[var(--inv-card-bg)] px-6 py-8 text-sm text-muted-foreground">
            {label}
        </div>
    );
}

function GuestGreeting({
    variant,
    ctx,
}: {
    variant: string;
    ctx: RenderContext;
}): ReactNode {
    // Owns the ?tamu guest name: hidden until hydrated AND non-empty (SSR-safe).
    if (!ctx.hydrated || ctx.guestName === '') {
        return null;
    }

    if (variant === 'inline') {
        return (
            <p className="mb-6 text-muted-foreground">
                Kepada Bapak/Ibu/Saudara/i{' '}
                <span className="font-medium text-foreground">
                    {ctx.guestName}
                </span>
            </p>
        );
    }

    return (
        <div className="mt-8 rounded-lg bg-white/15 px-6 py-3 backdrop-blur">
            <p className="text-sm">Kepada Bapak/Ibu/Saudara/i</p>
            <p className="font-serif text-xl">{ctx.guestName}</p>
        </div>
    );
}

export const WIDGET_REGISTRY: Record<WidgetKind, WidgetSpec> = {
    countdown: {
        kind: 'countdown',
        label: 'Hitung Mundur',
        bindingSchema: { target: { label: 'Tanggal Target', required: true } },
        isRepeater: false,
        defaultVisibleWhen: { when: 'notEmpty', field: 'wedding_date' },
        render: (resolved) => <Countdown targetIso={resolved.target} />,
    },
    event: {
        kind: 'event',
        label: 'Acara',
        bindingSchema: {
            title: { label: 'Judul', required: true },
            datetime: { label: 'Waktu', required: false },
            venue: { label: 'Lokasi', required: false },
            address: { label: 'Alamat', required: false },
            mapsUrl: { label: 'Google Maps', required: false },
        },
        isRepeater: false,
        render: (resolved, ctx) => (
            <EventBlock
                title={resolved.title}
                datetime={resolved.datetime || null}
                tz={ctx.invitation.timezone}
                venue={resolved.venue || null}
                address={resolved.address || null}
                mapsUrl={resolved.mapsUrl || null}
            />
        ),
    },
    love_story: {
        kind: 'love_story',
        label: 'Kisah Cinta',
        bindingSchema: { story: { label: 'Kisah', required: true } },
        isRepeater: false,
        defaultVisibleWhen: { when: 'notEmpty', field: 'love_story' },
        render: (resolved) => <LoveStoryTimeline story={resolved.story} />,
    },
    gallery: {
        kind: 'gallery',
        label: 'Galeri',
        bindingSchema: {},
        isRepeater: true,
        defaultVisibleWhen: { when: 'arrayNotEmpty', source: 'gallery_photos' },
        render: (_resolved, ctx) => (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {ctx.invitation.gallery_photos.map((photo) => (
                    <img
                        key={photo.id}
                        src={photo.photo_url}
                        alt=""
                        loading="lazy"
                        className="aspect-square w-full rounded-lg object-cover"
                    />
                ))}
            </div>
        ),
    },
    rsvp: {
        kind: 'rsvp',
        label: 'Konfirmasi Kehadiran',
        bindingSchema: { slug: { label: 'Slug', required: true } },
        isRepeater: false,
        render: (resolved, ctx) =>
            ctx.preview ? (
                <PreviewStub label="Formulir RSVP" />
            ) : (
                <RsvpForm slug={resolved.slug} defaultName={ctx.guestName} />
            ),
    },
    guest_book: {
        kind: 'guest_book',
        label: 'Buku Tamu',
        bindingSchema: { slug: { label: 'Slug', required: true } },
        isRepeater: true,
        defaultVisibleWhen: { when: 'addon', addon: 'guest_book' },
        render: (resolved, ctx) =>
            ctx.preview ? (
                <PreviewStub label="Buku Tamu" />
            ) : (
                <GuestBook
                    slug={resolved.slug}
                    initialEntries={ctx.invitation.guest_book_entries ?? []}
                />
            ),
    },
    gift: {
        kind: 'gift',
        label: 'Angpao Digital',
        bindingSchema: {},
        isRepeater: true,
        defaultVisibleWhen: { when: 'arrayNotEmpty', source: 'gift_accounts' },
        render: (_resolved, ctx) => (
            <div className="grid gap-4 sm:grid-cols-2">
                {ctx.invitation.gift_accounts.map((gift) => (
                    <GiftCard key={gift.id} gift={gift} />
                ))}
            </div>
        ),
    },
    visitor_counter: {
        kind: 'visitor_counter',
        label: 'Penghitung Pengunjung',
        bindingSchema: { slug: { label: 'Slug', required: true } },
        isRepeater: false,
        render: (resolved, ctx) =>
            ctx.preview ? (
                <PreviewStub label="Penghitung Pengunjung" />
            ) : (
                <VisitorCounter slug={resolved.slug} />
            ),
    },
    wa_share: {
        kind: 'wa_share',
        label: 'Bagikan WhatsApp',
        bindingSchema: { slug: { label: 'Slug', required: true } },
        isRepeater: false,
        render: (resolved, ctx) =>
            ctx.preview ? (
                <PreviewStub label="Tombol Bagikan WhatsApp" />
            ) : (
                <WaShareButton slug={resolved.slug} guestName={ctx.guestName} />
            ),
    },
    guest_greeting: {
        kind: 'guest_greeting',
        label: 'Sapaan Tamu',
        bindingSchema: { variant: { label: 'Tampilan', required: true } },
        isRepeater: false,
        render: (resolved, ctx) => (
            <GuestGreeting variant={resolved.variant || 'card'} ctx={ctx} />
        ),
    },
};
