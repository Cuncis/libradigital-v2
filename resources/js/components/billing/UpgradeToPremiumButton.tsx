import { router, usePage } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import PaymentController from '@/actions/App/Http/Controllers/PaymentController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { postJson } from '@/lib/api';
import { loadSnap } from '@/lib/midtrans';

interface Props {
    clientKey: string;
    isProduction: boolean;
}

export default function UpgradeToPremiumButton({
    clientKey,
    isProduction,
}: Props) {
    const { auth } = usePage().props;
    const [loading, setLoading] = useState(false);

    if (auth.user.plan === 'premium') {
        return <Badge>Premium</Badge>;
    }

    const upgrade = async () => {
        setLoading(true);

        try {
            const response = await postJson<{ snap_token: string }>(
                PaymentController.upgrade().url,
                {},
            );

            await loadSnap(clientKey, isProduction);

            window.snap?.pay(response.data.snap_token, {
                onSuccess: () => router.reload(),
                onPending: () => router.reload(),
                onError: () => setLoading(false),
                onClose: () => setLoading(false),
            });
        } catch {
            setLoading(false);
        }
    };

    return (
        <Button onClick={upgrade} disabled={loading} variant="outline">
            {loading && <Loader2 className="size-4 animate-spin" />}
            Upgrade ke Premium
        </Button>
    );
}
