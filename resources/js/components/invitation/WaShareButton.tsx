import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WaShareButton({
    slug,
    guestName,
}: {
    slug: string;
    guestName?: string;
}) {
    const share = () => {
        const base = `${window.location.origin}/undangan/${slug}`;
        const url = guestName
            ? `${base}?tamu=${encodeURIComponent(guestName)}`
            : base;
        const greeting = guestName ? `Yth. ${guestName}, ` : '';
        const text = `${greeting}kami mengundang Anda ke pernikahan kami. Buka undangan: ${url}`;

        window.open(
            `https://wa.me/?text=${encodeURIComponent(text)}`,
            '_blank',
            'noopener,noreferrer',
        );
    };

    return (
        <Button type="button" variant="outline" onClick={share}>
            <Share2 className="size-4" /> Bagikan via WhatsApp
        </Button>
    );
}
