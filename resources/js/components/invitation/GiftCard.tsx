import { Check, Copy, CreditCard, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { GiftAccount } from '@/types/invitation';

export default function GiftCard({ gift }: { gift: GiftAccount }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(gift.account_number);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard may be unavailable; silently ignore.
        }
    };

    const Icon = gift.type === 'bank' ? CreditCard : Wallet;

    return (
        <div className="rounded-xl border border-rose-200/60 bg-white/70 p-5 text-left dark:border-rose-900/40 dark:bg-neutral-900/60">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="size-4" />
                <span className="uppercase">
                    {gift.type === 'bank' ? 'Bank' : 'E-Wallet'}
                </span>
            </div>
            <p className="mt-2 font-serif text-lg">{gift.provider_name}</p>
            <p className="font-mono text-xl tracking-wider tabular-nums">
                {gift.account_number}
            </p>
            <p className="text-sm text-muted-foreground">
                a.n. {gift.account_name}
            </p>
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={copy}
            >
                {copied ? (
                    <>
                        <Check className="size-4" /> Tersalin
                    </>
                ) : (
                    <>
                        <Copy className="size-4" /> Salin Nomor
                    </>
                )}
            </Button>
        </div>
    );
}
