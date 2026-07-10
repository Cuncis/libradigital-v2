import type { CSSProperties } from 'react';

/**
 * A published invitation renders in a fixed palette regardless of the viewer's
 * light/dark preference. Each theme provides the page background + base text as
 * literal Tailwind classes, plus a set of `--inv-*` CSS variables consumed by
 * the shared section components (accent, cards, soft states, heading font).
 */
export interface InvitationTheme {
    /** Full page background gradient (literal Tailwind classes). */
    page: string;
    /** Base body text colour. */
    text: string;
    /** CSS custom properties applied to the page wrapper. */
    vars: CSSProperties;
    /** Small decorative flourish shown beneath the couple's names. */
    ornament: string;
}

const SERIF = 'ui-serif, Georgia, "Times New Roman", serif';
const SANS =
    '"Instrument Sans", ui-sans-serif, system-ui, sans-serif';

const THEMES: Record<string, InvitationTheme> = {
    default: {
        page: 'bg-gradient-to-b from-rose-50 via-white to-rose-50',
        text: 'text-neutral-800',
        ornament: '❦',
        vars: {
            '--inv-accent': '#f43f5e',
            '--inv-accent-strong': '#881337',
            '--inv-card-bg': 'rgba(255, 255, 255, 0.7)',
            '--inv-card-border': 'rgba(254, 205, 211, 0.6)',
            '--inv-soft-bg': '#fff1f2',
            '--inv-soft-text': '#be123c',
            '--inv-font-heading': SERIF,
        } as CSSProperties,
    },
    javanese: {
        page: 'bg-gradient-to-b from-[#f5efe6] via-[#faf6ef] to-[#efe4d3]',
        text: 'text-[#4a3f30]',
        ornament: '꧁ ꧂',
        vars: {
            '--inv-accent': '#8b6f47',
            '--inv-accent-strong': '#5b4a2f',
            '--inv-card-bg': 'rgba(255, 251, 245, 0.75)',
            '--inv-card-border': 'rgba(139, 111, 71, 0.3)',
            '--inv-soft-bg': '#f1e7d6',
            '--inv-soft-text': '#6b5335',
            '--inv-font-heading': SERIF,
        } as CSSProperties,
    },
    sundanese: {
        page: 'bg-gradient-to-b from-[#fbf6e3] via-white to-[#f6ebc9]',
        text: 'text-[#4b3f1e]',
        ornament: '✻',
        vars: {
            '--inv-accent': '#c9a227',
            '--inv-accent-strong': '#7a5c00',
            '--inv-card-bg': 'rgba(255, 253, 245, 0.8)',
            '--inv-card-border': 'rgba(201, 162, 39, 0.35)',
            '--inv-soft-bg': '#fbf3d6',
            '--inv-soft-text': '#8a6a00',
            '--inv-font-heading': SERIF,
        } as CSSProperties,
    },
    modern: {
        page: 'bg-gradient-to-b from-neutral-50 via-white to-neutral-100',
        text: 'text-neutral-700',
        ornament: '—',
        vars: {
            '--inv-accent': '#334155',
            '--inv-accent-strong': '#0f172a',
            '--inv-card-bg': 'rgba(255, 255, 255, 0.8)',
            '--inv-card-border': 'rgba(15, 23, 42, 0.12)',
            '--inv-soft-bg': '#f1f5f9',
            '--inv-soft-text': '#0f172a',
            '--inv-font-heading': SANS,
        } as CSSProperties,
    },
};

/**
 * Resolve the theme for a template category, falling back to the rose default.
 */
export function resolveTheme(category?: string | null): InvitationTheme {
    return (category && THEMES[category]) || THEMES.default;
}
