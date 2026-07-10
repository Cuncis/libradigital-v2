import { Head } from '@inertiajs/react';
import { CalendarHeart, MapPin } from 'lucide-react';
import Countdown from '@/components/invitation/Countdown';
import GiftCard from '@/components/invitation/GiftCard';
import RsvpForm from '@/components/invitation/RsvpForm';
import VisitorCounter from '@/components/invitation/VisitorCounter';
import WaShareButton from '@/components/invitation/WaShareButton';
import { Button } from '@/components/ui/button';
import { formatIndoDate, formatIndoTime } from '@/lib/format';
import type { PublicInvitation } from '@/types/invitation';

function useTamu(): string {
    if (typeof window === 'undefined') {
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
        <h2 className="mb-8 font-serif text-3xl font-semibold text-rose-900 dark:text-rose-100">
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
        <div className="rounded-2xl border border-rose-200/60 bg-white/70 p-8 dark:border-rose-900/40 dark:bg-neutral-900/60">
            <CalendarHeart className="mx-auto size-8 text-rose-500" />
            <h3 className="mt-3 font-serif text-2xl">{title}</h3>
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

    return (
        <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-50 text-neutral-800 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 dark:text-neutral-100">
            <Head title={`Undangan Pernikahan ${couple}`} />

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
                <div className="relative">
                    <p className="text-sm tracking-[0.3em] uppercase">
                        The Wedding Of
                    </p>
                    <h1 className="mt-4 font-serif text-5xl font-semibold sm:text-6xl">
                        {invitation.groom_name}
                        <span className="mx-3 text-rose-300">&amp;</span>
                        {invitation.bride_name}
                    </h1>
                    {invitation.wedding_date && (
                        <p className="mt-4 text-lg">
                            {formatIndoDate(invitation.wedding_date)}
                        </p>
                    )}
                    {tamu && (
                        <div className="mt-8 rounded-lg bg-white/15 px-6 py-3 backdrop-blur">
                            <p className="text-sm">
                                Kepada Bapak/Ibu/Saudara/i
                            </p>
                            <p className="font-serif text-xl">{tamu}</p>
                        </div>
                    )}
                </div>
            </header>

            {/* 2. Countdown */}
            {invitation.wedding_date && (
                <Section>
                    <SectionTitle>Menuju Hari Bahagia</SectionTitle>
                    <Countdown targetIso={invitation.wedding_date} />
                </Section>
            )}

            {/* 3 + 4. Akad & Resepsi */}
            <Section>
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
                <Section>
                    <SectionTitle>Kisah Kami</SectionTitle>
                    <p className="mx-auto max-w-xl leading-relaxed whitespace-pre-line text-muted-foreground">
                        {invitation.love_story}
                    </p>
                </Section>
            )}

            {/* 6. Gallery */}
            {invitation.gallery_photos.length > 0 && (
                <Section className="max-w-4xl">
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
            </Section>

            {/* 8. Digital Gift */}
            {invitation.gift_accounts.length > 0 && (
                <Section>
                    <SectionTitle>Angpao Digital</SectionTitle>
                    <p className="mb-6 text-muted-foreground">
                        Doa restu Anda merupakan karunia yang sangat berarti.
                        Jika memberi tanda kasih, dapat melalui:
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {invitation.gift_accounts.map((gift) => (
                            <GiftCard key={gift.id} gift={gift} />
                        ))}
                    </div>
                </Section>
            )}

            {/* 9. WhatsApp share */}
            <Section>
                <WaShareButton slug={invitation.slug} guestName={tamu} />
            </Section>

            {/* 10 + 11. Visitor counter + footer */}
            <footer className="border-t border-rose-200/50 py-10 text-center dark:border-rose-900/30">
                <div className="mb-4">
                    <VisitorCounter slug={invitation.slug} />
                </div>
                <p className="font-serif text-lg">{couple}</p>
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
