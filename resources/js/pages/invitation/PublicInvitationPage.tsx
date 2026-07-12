import { Head } from '@inertiajs/react';
import { CalendarHeart, MapPin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AnimatedReveal from '@/components/invitation/AnimatedReveal';
import AnimationLayer from '@/components/invitation/AnimationLayer';
import Countdown from '@/components/invitation/Countdown';
import GiftCard from '@/components/invitation/GiftCard';
import GuestBook from '@/components/invitation/GuestBook';
import InvitationCover from '@/components/invitation/InvitationCover';
import LoveStoryTimeline from '@/components/invitation/LoveStoryTimeline';
import RsvpForm from '@/components/invitation/RsvpForm';
import VisitorCounter from '@/components/invitation/VisitorCounter';
import WaShareButton from '@/components/invitation/WaShareButton';
import { Button } from '@/components/ui/button';
import { useHydrated } from '@/hooks/use-hydrated';
import { resolveCoverEffect } from '@/lib/cover-animation';
import { formatIndoDate, formatIndoTime } from '@/lib/format';
import { resolveTheme } from '@/lib/themes';
import { cn } from '@/lib/utils';
import type { PublicInvitation } from '@/types/invitation';

function useTamu(): string {
    // Read the guest name only after hydration so the server and first client
    // render agree (avoids an SSR hydration mismatch on the greeting blocks).
    const hydrated = useHydrated();

    if (!hydrated) {
        return '';
    }

    return new URLSearchParams(window.location.search).get('tamu') ?? '';
}

function Section({
    id,
    className = '',
    children,
}: {
    id?: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <section
            id={id}
            className={`mx-auto w-full max-w-2xl px-6 py-16 text-center ${className}`}
        >
            {children}
        </section>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h2 className="mb-8 [font-family:var(--inv-font-heading)] text-3xl font-semibold text-[var(--inv-accent-strong)]">
            {children}
        </h2>
    );
}

function EventBlock({
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
                <Button asChild variant="outline" className="mt-5">
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                        <MapPin className="size-4" /> Buka di Google Maps
                    </a>
                </Button>
            )}
        </div>
    );
}

export default function PublicInvitationPage({
    invitation,
}: {
    invitation: PublicInvitation;
}) {
    const tamu = useTamu();
    const couple = `${invitation.groom_name ?? ''} & ${invitation.bride_name ?? ''}`;
    const theme = resolveTheme(invitation.template?.category);

    // Floating-overlay animation pack (one per invitation, targeting one section).
    const pack = invitation.animation_pack ?? null;
    const layerFor = (section: string) =>
        pack && pack.section === section ? (
            <AnimationLayer pack={pack} />
        ) : null;

    // The invitation stays behind a full-screen cover until the guest taps
    // "Buka Undangan". While the cover is up we lock body scroll so the page
    // underneath can't be reached.
    const [opened, setOpened] = useState(false);
    const [coverGone, setCoverGone] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (opened) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [opened]);

    const handleOpen = () => {
        setOpened(true);
        window.scrollTo({ top: 0 });

        // Keep the cover mounted long enough to finish its exit animation.
        window.setTimeout(
            () => setCoverGone(true),
            resolveCoverEffect(invitation.animations?.cover, invitation.package)
                .durationMs,
        );

        // Opening is a user gesture, so background music is allowed to start.
        if (invitation.music_url && audioRef.current) {
            audioRef.current.play().catch(() => {
                // Autoplay may still be blocked; ignore silently.
            });
        }
    };

    return (
        <div
            className={cn(
                'invitation-scope min-h-screen',
                theme.page,
                theme.text,
            )}
            style={theme.vars}
        >
            <Head title={`Undangan Pernikahan ${couple}`} />

            {!coverGone && (
                <InvitationCover
                    tier={invitation.package}
                    animation={invitation.animations?.cover}
                    coverPhoto={invitation.cover_photo}
                    groomName={invitation.groom_name}
                    brideName={invitation.bride_name}
                    weddingDate={invitation.wedding_date}
                    guestName={tamu}
                    ornament={theme.ornament}
                    onOpen={handleOpen}
                />
            )}

            {invitation.music_url && (
                <audio ref={audioRef} src={invitation.music_url} loop />
            )}

            {/* Full-page floating overlay pack (pinned to the viewport). */}
            {pack?.section === 'full_page' && (
                <div className="pointer-events-none fixed inset-0 z-40">
                    <AnimationLayer pack={pack} />
                </div>
            )}

            {/* 1. Hero */}
            <header className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center text-white">
                {invitation.cover_photo && (
                    <img
                        src={invitation.cover_photo}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                )}
                <div className="absolute inset-0 bg-black/45" />
                <AnimatedReveal
                    animation={invitation.animations?.header}
                    fallback="zoom"
                    className="relative"
                >
                    <p className="text-sm tracking-[0.3em] uppercase">
                        The Wedding Of
                    </p>
                    <h1 className="mt-4 [font-family:var(--inv-font-heading)] text-5xl font-semibold sm:text-6xl">
                        {invitation.groom_name}
                        <span className="mx-3 text-white/70">&amp;</span>
                        {invitation.bride_name}
                    </h1>
                    {invitation.wedding_date && (
                        <p className="mt-4 text-lg">
                            {formatIndoDate(invitation.wedding_date)}
                        </p>
                    )}
                    <p className="mt-6 text-2xl text-white/80">
                        {theme.ornament}
                    </p>
                    {tamu && (
                        <div className="mt-8 rounded-lg bg-white/15 px-6 py-3 backdrop-blur">
                            <p className="text-sm">
                                Kepada Bapak/Ibu/Saudara/i
                            </p>
                            <p className="font-serif text-xl">{tamu}</p>
                        </div>
                    )}
                </AnimatedReveal>
                {layerFor('hero')}
            </header>

            {/* 2. Countdown */}
            {invitation.wedding_date && (
                <Section>
                    <AnimatedReveal
                        animation={invitation.animations?.countdown}
                    >
                        <SectionTitle>Menuju Hari Bahagia</SectionTitle>
                        <Countdown targetIso={invitation.wedding_date} />
                    </AnimatedReveal>
                </Section>
            )}

            {/* 3 + 4. Akad & Resepsi */}
            <Section className="relative">
                {layerFor('event')}
                <div className="grid gap-6 sm:grid-cols-2">
                    <EventBlock
                        title="Akad Nikah"
                        datetime={invitation.akad_datetime}
                        tz={invitation.timezone}
                        venue={invitation.akad_venue}
                        address={invitation.akad_address}
                        mapsUrl={invitation.maps_url_akad}
                    />
                    <EventBlock
                        title="Resepsi"
                        datetime={invitation.resepsi_datetime}
                        tz={invitation.timezone}
                        venue={invitation.resepsi_venue}
                        address={invitation.resepsi_address}
                        mapsUrl={invitation.maps_url_resepsi}
                    />
                </div>
            </Section>

            {/* 5. Love Story */}
            {invitation.love_story && (
                <Section className="relative">
                    {layerFor('story')}
                    <AnimatedReveal
                        animation={invitation.animations?.love_story}
                        fallback="slide_left"
                    >
                        <SectionTitle>Kisah Kami</SectionTitle>
                        <LoveStoryTimeline story={invitation.love_story} />
                    </AnimatedReveal>
                </Section>
            )}

            {/* 6. Gallery */}
            {invitation.gallery_photos.length > 0 && (
                <Section className="relative max-w-4xl">
                    {layerFor('gallery')}
                    <SectionTitle>Galeri</SectionTitle>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {invitation.gallery_photos.map((photo) => (
                            <img
                                key={photo.id}
                                src={photo.photo_url}
                                alt=""
                                loading="lazy"
                                className="aspect-square w-full rounded-lg object-cover"
                            />
                        ))}
                    </div>
                </Section>
            )}

            {/* 7. RSVP */}
            <Section>
                <AnimatedReveal
                    animation={invitation.animations?.rsvp}
                    fallback="slide_up"
                >
                    <SectionTitle>Konfirmasi Kehadiran</SectionTitle>
                    {tamu && (
                        <p className="mb-6 text-muted-foreground">
                            Kepada Bapak/Ibu/Saudara/i{' '}
                            <span className="font-medium text-foreground">
                                {tamu}
                            </span>
                        </p>
                    )}
                    <RsvpForm slug={invitation.slug} defaultName={tamu} />
                </AnimatedReveal>
            </Section>

            {/* 7b. Guest book (guest_book add-on) */}
            {invitation.has_guest_book && (
                <Section>
                    <SectionTitle>Buku Tamu</SectionTitle>
                    <p className="mb-6 text-muted-foreground">
                        Tinggalkan ucapan dan doa untuk kedua mempelai.
                    </p>
                    <GuestBook
                        slug={invitation.slug}
                        initialEntries={invitation.guest_book_entries ?? []}
                    />
                </Section>
            )}

            {/* 8. Digital Gift */}
            {invitation.gift_accounts.length > 0 && (
                <Section>
                    <AnimatedReveal
                        animation={invitation.animations?.gift}
                        fallback="zoom"
                    >
                        <SectionTitle>Angpao Digital</SectionTitle>
                        <p className="mb-6 text-muted-foreground">
                            Doa restu Anda merupakan karunia yang sangat
                            berarti. Jika memberi tanda kasih, dapat melalui:
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {invitation.gift_accounts.map((gift) => (
                                <GiftCard key={gift.id} gift={gift} />
                            ))}
                        </div>
                    </AnimatedReveal>
                </Section>
            )}

            {/* 9. WhatsApp share */}
            <Section>
                <WaShareButton slug={invitation.slug} guestName={tamu} />
            </Section>

            {/* 10 + 11. Visitor counter + footer */}
            <footer className="relative border-t border-[var(--inv-card-border)] py-10 text-center">
                {layerFor('footer')}
                <div className="mb-4">
                    <VisitorCounter slug={invitation.slug} />
                </div>
                <p className="[font-family:var(--inv-font-heading)] text-lg">
                    {couple}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                    Dibuat dengan 🤍 di{' '}
                    <a href="https://libradigital.id" className="underline">
                        libradigital.id
                    </a>
                </p>
            </footer>
        </div>
    );
}
