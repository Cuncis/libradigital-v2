import { useState } from 'react';
import TemplateRenderer from '@/components/invitation/TemplateRenderer';
import { useHydrated } from '@/hooks/use-hydrated';
import { useViewportDevice } from '@/hooks/use-viewport-device';
import type { TemplateLayout } from '@/lib/template/nodes';
import { cn } from '@/lib/utils';
import type { PublicInvitation } from '@/types/invitation';

/**
 * A superadmin-designed cover ("Buka Undangan" screen), rendered from the
 * template's cover node tree. The open button inside the tree (action:'open')
 * is wired to {@link onOpen} via the render context; on tap the whole cover
 * fades out, then the parent unmounts it once the exit finishes.
 */
export default function CustomCover({
    cover,
    invitation,
    guestName,
    onOpen,
}: {
    cover: TemplateLayout;
    invitation: PublicInvitation;
    guestName: string;
    onOpen: () => void;
}) {
    const hydrated = useHydrated();
    const device = useViewportDevice();
    const [opening, setOpening] = useState(false);

    const handleOpen = () => {
        if (opening) {
            return;
        }

        setOpening(true);
        onOpen();
    };

    return (
        <div
            className={cn(
                'fixed inset-0 z-50 overflow-auto',
                opening && 'inv-exit-fade',
            )}
            aria-hidden={opening}
        >
            <TemplateRenderer
                layout={cover}
                ctx={{
                    invitation,
                    guestName,
                    hydrated,
                    device,
                    onOpen: handleOpen,
                }}
            />
        </div>
    );
}
