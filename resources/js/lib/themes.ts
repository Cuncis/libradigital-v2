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
const SANS = '"Instrument Sans", ui-sans-serif, system-ui, sans-serif';

/**
 * Every named palette. Keys are referenced by the slug/category maps and the
 * rotation list below, so each template can carry a visibly distinct look.
 */
const THEMES = {
    // Rose — the soft romantic default.
    rose: {
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
    // Javanese Elegance — batik brown & antique gold, ornate serif.
    javaneseElegance: {
        page: 'bg-gradient-to-b from-[#efe6d6] via-[#f7f1e6] to-[#e3d4bd]',
        text: 'text-[#46392b]',
        ornament: '꧁ ❦ ꧂',
        vars: {
            '--inv-accent': '#9a7b4f',
            '--inv-accent-strong': '#5b4227',
            '--inv-card-bg': 'rgba(255, 251, 244, 0.78)',
            '--inv-card-border': 'rgba(154, 123, 79, 0.32)',
            '--inv-soft-bg': '#f1e7d6',
            '--inv-soft-text': '#6b5335',
            '--inv-font-heading': SERIF,
        } as CSSProperties,
    },
    // Sundanese Gold — ivory & emerald with rich gold accents.
    sundaneseGold: {
        page: 'bg-gradient-to-b from-[#f6f3e6] via-[#fbfbf3] to-[#e8f0e2]',
        text: 'text-[#3f3a24]',
        ornament: '❁',
        vars: {
            '--inv-accent': '#c39a1f',
            '--inv-accent-strong': '#1f5c3d',
            '--inv-card-bg': 'rgba(255, 253, 244, 0.82)',
            '--inv-card-border': 'rgba(195, 154, 31, 0.35)',
            '--inv-soft-bg': '#f4edcf',
            '--inv-soft-text': '#1f5c3d',
            '--inv-font-heading': SERIF,
        } as CSSProperties,
    },
    // Modern Minimalist — monochrome charcoal, clean sans.
    modernMinimalist: {
        page: 'bg-gradient-to-b from-neutral-50 via-white to-neutral-100',
        text: 'text-neutral-700',
        ornament: '—',
        vars: {
            '--inv-accent': '#334155',
            '--inv-accent-strong': '#0f172a',
            '--inv-card-bg': 'rgba(255, 255, 255, 0.82)',
            '--inv-card-border': 'rgba(15, 23, 42, 0.12)',
            '--inv-soft-bg': '#f1f5f9',
            '--inv-soft-text': '#0f172a',
            '--inv-font-heading': SANS,
        } as CSSProperties,
    },
    // Batak — bold ulos red & charcoal, striking serif.
    batak: {
        page: 'bg-gradient-to-b from-[#f7eef0] via-white to-[#f0dcdf]',
        text: 'text-[#3a2a2c]',
        ornament: '✜',
        vars: {
            '--inv-accent': '#b02a37',
            '--inv-accent-strong': '#5e161d',
            '--inv-card-bg': 'rgba(255, 250, 250, 0.82)',
            '--inv-card-border': 'rgba(176, 42, 55, 0.28)',
            '--inv-soft-bg': '#f6e4e6',
            '--inv-soft-text': '#5e161d',
            '--inv-font-heading': SERIF,
        } as CSSProperties,
    },
    // Sage — botanical green & terracotta.
    sage: {
        page: 'bg-gradient-to-b from-[#eef1e9] via-white to-[#e1e8d8]',
        text: 'text-[#3c4534]',
        ornament: '❧',
        vars: {
            '--inv-accent': '#6b8f71',
            '--inv-accent-strong': '#3f5c46',
            '--inv-card-bg': 'rgba(253, 255, 250, 0.82)',
            '--inv-card-border': 'rgba(107, 143, 113, 0.3)',
            '--inv-soft-bg': '#e8efe1',
            '--inv-soft-text': '#3f5c46',
            '--inv-font-heading': SERIF,
        } as CSSProperties,
    },
    // Dusk — plum & mauve, dreamy serif.
    dusk: {
        page: 'bg-gradient-to-b from-[#f3edf5] via-white to-[#e7dced]',
        text: 'text-[#42323f]',
        ornament: '✦',
        vars: {
            '--inv-accent': '#8b5e83',
            '--inv-accent-strong': '#4a2f47',
            '--inv-card-bg': 'rgba(254, 252, 255, 0.82)',
            '--inv-card-border': 'rgba(139, 94, 131, 0.28)',
            '--inv-soft-bg': '#efe4ef',
            '--inv-soft-text': '#4a2f47',
            '--inv-font-heading': SERIF,
        } as CSSProperties,
    },
    // Ocean — teal & navy, airy sans.
    ocean: {
        page: 'bg-gradient-to-b from-[#eaf3f4] via-white to-[#d8ecee]',
        text: 'text-[#22424a]',
        ornament: '≈',
        vars: {
            '--inv-accent': '#0e7490',
            '--inv-accent-strong': '#0c4a5e',
            '--inv-card-bg': 'rgba(250, 254, 255, 0.82)',
            '--inv-card-border': 'rgba(14, 116, 144, 0.26)',
            '--inv-soft-bg': '#e2f1f3',
            '--inv-soft-text': '#0c4a5e',
            '--inv-font-heading': SANS,
        } as CSSProperties,
    },
    // Burgundy — deep wine & blush, romantic serif.
    burgundy: {
        page: 'bg-gradient-to-b from-[#f7ecec] via-white to-[#efd7da]',
        text: 'text-[#3f2226]',
        ornament: '❧',
        vars: {
            '--inv-accent': '#9b2d3a',
            '--inv-accent-strong': '#5e1620',
            '--inv-card-bg': 'rgba(255, 251, 251, 0.82)',
            '--inv-card-border': 'rgba(155, 45, 58, 0.26)',
            '--inv-soft-bg': '#f6e2e4',
            '--inv-soft-text': '#5e1620',
            '--inv-font-heading': SERIF,
        } as CSSProperties,
    },
    // Midnight — inky navy & champagne gold, luxe sans.
    midnight: {
        page: 'bg-gradient-to-b from-[#eef1f6] via-white to-[#dde3ee]',
        text: 'text-[#26303f]',
        ornament: '✧',
        vars: {
            '--inv-accent': '#b08d4f',
            '--inv-accent-strong': '#1e293b',
            '--inv-card-bg': 'rgba(252, 253, 255, 0.82)',
            '--inv-card-border': 'rgba(30, 41, 59, 0.16)',
            '--inv-soft-bg': '#e7ebf3',
            '--inv-soft-text': '#1e293b',
            '--inv-font-heading': SANS,
        } as CSSProperties,
    },
} satisfies Record<string, InvitationTheme>;

type ThemeName = keyof typeof THEMES;

/** Hand-picked look for each seeded template (by slug). */
const SLUG_THEME: Record<string, ThemeName> = {
    'javanese-elegance': 'javaneseElegance',
    'sundanese-gold': 'sundaneseGold',
    'modern-minimalist': 'modernMinimalist',
};

/** Ethnic-appropriate fallback per category. */
const CATEGORY_THEME: Record<string, ThemeName> = {
    javanese: 'javaneseElegance',
    sundanese: 'sundaneseGold',
    batak: 'batak',
    modern: 'modernMinimalist',
};

/**
 * Rotation used to give every other template a distinct, stable look — picked
 * deterministically from its slug so it never changes between renders. Excludes
 * the curated bespoke themes so a random template never mimics a seed template.
 */
const ROTATION: ThemeName[] = [
    'rose',
    'sage',
    'dusk',
    'ocean',
    'batak',
    'burgundy',
    'midnight',
];

/** Stable non-negative hash of a string (djb2). */
function hashString(value: string): number {
    let hash = 5381;

    for (let i = 0; i < value.length; i++) {
        hash = (hash * 33) ^ value.charCodeAt(i);
    }

    return Math.abs(hash);
}

/**
 * Resolve a template's theme so every template gets its own look:
 *   1. a hand-picked theme for the curated seed templates (by slug),
 *   2. otherwise a stable slug-hashed rotation — distinct per template and
 *      constant across renders (so same-category templates never collide),
 *   3. a category theme when only a category is known (slug-less previews),
 *   4. the rose default as the final fallback.
 */
export function resolveTheme(
    template?: { slug?: string | null; category?: string | null } | null,
): InvitationTheme {
    const slug = template?.slug ?? null;
    const category = template?.category ?? null;

    if (slug && SLUG_THEME[slug]) {
        return THEMES[SLUG_THEME[slug]];
    }

    if (slug) {
        return THEMES[ROTATION[hashString(slug) % ROTATION.length]];
    }

    if (category && CATEGORY_THEME[category]) {
        return THEMES[CATEGORY_THEME[category]];
    }

    return THEMES.rose;
}
