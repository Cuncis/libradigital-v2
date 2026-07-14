import { Head } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AnimationLayer from '@/components/invitation/AnimationLayer';
import InvitationCover from '@/components/invitation/InvitationCover';
import TemplateRenderer from '@/components/invitation/TemplateRenderer';
import { useHydrated } from '@/hooks/use-hydrated';
import { resolveCoverEffect } from '@/lib/cover-animation';
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

export default function PublicInvitationPage({
    invitation,
}: {
    invitation: PublicInvitation;
}) {
    const tamu = useTamu();
    const hydrated = useHydrated();
    const couple = `${invitation.groom_name ?? ''} & ${invitation.bride_name ?? ''}`;
    const theme = resolveTheme(invitation.template?.category);

    // Full-page floating pack (pinned to the viewport). Per-section packs are
    // rendered inside the tree by <TemplateRenderer> via packSection markers.
    const pack = invitation.animation_pack ?? null;

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

            <TemplateRenderer
                layout={invitation.layout}
                ctx={{ invitation, guestName: tamu, hydrated }}
            />
        </div>
    );
}
