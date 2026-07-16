/**
 * Template Builder — the renderer (§12 of TEMPLATE_BUILDER.md).
 *
 * Walks a layout node tree and produces the invitation body. Pure and
 * deterministic given (layout, ctx) so it is SSR-safe and can power both the
 * public page and (later) the builder canvas from one implementation.
 *
 * Phase 0 scaffold: correct structure + binding/visibility resolution. Pixel
 * parity with the legacy page and floating-pack wiring land in Phase 1.
 */
import type { CSSProperties, ReactNode } from 'react';
import AnimatedReveal from '@/components/invitation/AnimatedReveal';
import AnimationLayer from '@/components/invitation/AnimationLayer';
import LottiePlayer from '@/components/invitation/LottiePlayer';
import { evalVisibility, resolveValue } from '@/lib/template/bindableFields';
import type { RenderContext } from '@/lib/template/bindableFields';
import type {
    SectionNode,
    StyleProps,
    TemplateLayout,
    TreeNode,
} from '@/lib/template/nodes';
import { WIDGET_REGISTRY } from '@/lib/template/widgets';
import { cn } from '@/lib/utils';

// --- Style token → class maps (literal strings so Tailwind can scan them) ----

const PADDING: Record<NonNullable<StyleProps['padding']>, string> = {
    none: '',
    xs: 'p-2',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12',
    '2xl': 'p-16',
};
const MARGIN: Record<NonNullable<StyleProps['margin']>, string> = {
    none: '',
    xs: 'm-2',
    sm: 'm-4',
    md: 'm-6',
    lg: 'm-8',
    xl: 'm-12',
    '2xl': 'm-16',
};
const MAX_WIDTH: Record<NonNullable<StyleProps['maxWidth']>, string> = {
    prose: 'max-w-prose',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-full',
};
const BACKGROUND: Record<NonNullable<StyleProps['background']>, string> = {
    transparent: '',
    image: '',
    card: 'bg-[var(--inv-card-bg)]',
    soft: 'bg-[var(--inv-soft)]',
    accent: 'bg-[var(--inv-accent)]',
};
const RADIUS: Record<NonNullable<StyleProps['radius']>, string> = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    '2xl': 'rounded-2xl',
};
const ALIGN: Record<NonNullable<StyleProps['align']>, string> = {
    start: 'text-left',
    center: 'text-center',
    end: 'text-right',
};
const SIZE: Record<NonNullable<StyleProps['size']>, string> = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
    '6xl': 'text-6xl',
};
const WEIGHT: Record<NonNullable<StyleProps['weight']>, string> = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
};
const COLOR: Record<NonNullable<StyleProps['color']>, string> = {
    default: '',
    muted: 'text-muted-foreground',
    white: 'text-white',
    accent: 'text-[var(--inv-accent)]',
    'accent-strong': 'text-[var(--inv-accent-strong)]',
};
const TRACKING: Record<NonNullable<StyleProps['tracking']>, string> = {
    normal: '',
    wide: 'tracking-wide',
    wider: 'tracking-wider',
    widest: 'tracking-widest',
};
const MOTION: Record<NonNullable<StyleProps['motion']>, string> = {
    none: '',
    sway: 'inv-motion-sway',
    float: 'inv-motion-float',
    drift: 'inv-motion-drift',
    pulse: 'inv-motion-pulse',
    spin: 'inv-motion-spin',
};

function styleToClass(style: StyleProps | undefined | null): string {
    if (!style) {
        return '';
    }

    return cn(
        style.align && ALIGN[style.align],
        style.padding && PADDING[style.padding],
        style.margin && MARGIN[style.margin],
        style.maxWidth && MAX_WIDTH[style.maxWidth],
        style.background && BACKGROUND[style.background],
        style.radius && RADIUS[style.radius],
        style.font === 'heading' && '[font-family:var(--inv-font-heading)]',
        style.size && SIZE[style.size],
        style.weight && WEIGHT[style.weight],
        style.color && COLOR[style.color],
        style.tracking && TRACKING[style.tracking],
        style.case === 'upper' && 'uppercase',
        style.motion && MOTION[style.motion],
    );
}

/**
 * Custom per-side padding/margin (px) as inline styles. These override the
 * token-based `padding`/`margin` classes per side, giving admins fine control.
 */
function styleToInline(
    style: StyleProps | undefined | null,
): CSSProperties | undefined {
    const p = style?.paddingPx;
    const m = style?.marginPx;

    if (!p && !m) {
        return undefined;
    }

    // React drops CSS properties whose value is undefined, so only the sides the
    // admin actually set are applied.
    return {
        paddingTop: p?.top,
        paddingRight: p?.right,
        paddingBottom: p?.bottom,
        paddingLeft: p?.left,
        marginTop: m?.top,
        marginRight: m?.right,
        marginBottom: m?.bottom,
        marginLeft: m?.left,
    };
}

/**
 * The style layer that applies for the active device. Desktop (or unset) uses the
 * base `style`; mobile merges the `responsive.mobile` override over the base so a
 * blank override key transparently inherits the desktop value.
 */
function resolveStyle(
    node: TreeNode,
    ctx: RenderContext,
): StyleProps | undefined {
    if (ctx.device === 'mobile' && node.responsive?.mobile) {
        // The override also carries layout/columns (ignored by the style maps).
        return { ...node.style, ...node.responsive.mobile } as StyleProps;
    }

    return node.style;
}

const CONTAINER_LAYOUT: Record<'stack' | 'row' | 'grid', string> = {
    stack: 'flex flex-col',
    row: 'flex flex-row',
    grid: 'grid',
};
// Responsive column counts (mobile-first: grids stack on small screens), literal
// so Tailwind can scan them. Falls back to the 2-column layout.
const GRID_COLS: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
};
const GAP: Record<NonNullable<StyleProps['padding']>, string> = {
    none: 'gap-0',
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12',
    '2xl': 'gap-16',
};
// Vertical space for spacer nodes. `gap-*` only affects flex/grid children, so a
// standalone spacer needs an explicit height instead. Literal so Tailwind scans them.
const SPACER_HEIGHT: Record<NonNullable<StyleProps['padding']>, string> = {
    none: 'h-0',
    xs: 'h-2',
    sm: 'h-4',
    md: 'h-8',
    lg: 'h-12',
    xl: 'h-16',
    '2xl': 'h-24',
};

// --- Recursive render --------------------------------------------------------

function renderChildren(
    children: TreeNode[] | undefined,
    ctx: RenderContext,
): ReactNode {
    return children?.map((child) => renderNode(child, ctx));
}

/**
 * The couple's chosen floating pack, when it targets this section. Skipped in the
 * builder (no GSAP in the editor) and when no pack matches.
 */
function renderPackOverlay(node: SectionNode, ctx: RenderContext): ReactNode {
    const pack = ctx.invitation.animation_pack;

    if (
        ctx.editor ||
        !pack ||
        !node.animationRef?.packSection ||
        pack.section !== node.animationRef.packSection
    ) {
        return null;
    }

    return <AnimationLayer pack={pack} />;
}

function renderSection(node: SectionNode, ctx: RenderContext): ReactNode {
    const overlay = renderPackOverlay(node, ctx);
    const style = resolveStyle(node, ctx);

    if (node.variant === 'hero') {
        const bg = node.backgroundImage
            ? resolveValue(node.backgroundImage, ctx)
            : '';

        return (
            <header
                className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center text-white"
                style={styleToInline(style)}
            >
                {bg && (
                    <img
                        src={bg}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                )}
                <div className="absolute inset-0 bg-black/45" />
                <div className="relative">
                    {renderChildren(node.children, ctx)}
                </div>
                {overlay}
            </header>
        );
    }

    if (node.variant === 'footer') {
        return (
            <footer
                className={cn(
                    'relative border-t border-[var(--inv-card-border)] py-10 text-center',
                    styleToClass(style),
                )}
                style={styleToInline(style)}
            >
                {renderChildren(node.children, ctx)}
                {overlay}
            </footer>
        );
    }

    return (
        <section
            className={cn(
                'mx-auto w-full max-w-2xl px-6 py-16 text-center',
                overlay && 'relative',
                styleToClass(style),
            )}
            style={styleToInline(style)}
        >
            {renderChildren(node.children, ctx)}
            {overlay}
        </section>
    );
}

function renderNode(node: TreeNode, ctx: RenderContext): ReactNode {
    if (!evalVisibility(node.visibleWhen, ctx)) {
        return null;
    }

    const inner = ((): ReactNode => {
        switch (node.type) {
            case 'section':
                return renderSection(node, ctx);
            case 'container': {
                // Container flow/columns can be overridden per device too.
                const override =
                    ctx.device === 'mobile'
                        ? node.responsive?.mobile
                        : undefined;
                const layout = override?.layout ?? node.layout;
                const columns = override?.columns ?? node.columns;

                return (
                    <div
                        className={cn(
                            CONTAINER_LAYOUT[layout],
                            layout === 'grid' &&
                                (GRID_COLS[columns ?? 2] ?? GRID_COLS[2]),
                            node.gap && GAP[node.gap],
                            styleToClass(resolveStyle(node, ctx)),
                        )}
                        style={styleToInline(resolveStyle(node, ctx))}
                    >
                        {renderChildren(node.children, ctx)}
                    </div>
                );
            }
            case 'text': {
                const text = resolveValue(node.value, ctx);
                const Tag =
                    node.tag === 'h1'
                        ? 'h1'
                        : node.tag === 'h2'
                          ? 'h2'
                          : node.tag === 'h3'
                            ? 'h3'
                            : 'p';

                return (
                    <Tag
                        className={styleToClass(resolveStyle(node, ctx))}
                        style={styleToInline(resolveStyle(node, ctx))}
                    >
                        {text}
                    </Tag>
                );
            }
            case 'image': {
                const src = resolveValue(node.src, ctx);

                if (!src) {
                    return null;
                }

                return (
                    <img
                        src={src}
                        alt={node.alt ?? ''}
                        className={cn(
                            node.fit === 'contain'
                                ? 'object-contain'
                                : 'object-cover',
                            styleToClass(resolveStyle(node, ctx)),
                        )}
                        style={styleToInline(resolveStyle(node, ctx))}
                    />
                );
            }
            case 'widget': {
                const spec = WIDGET_REGISTRY[node.widget];
                const resolved: Record<string, string> = {};

                for (const [prop, value] of Object.entries(node.bindings)) {
                    resolved[prop] = resolveValue(value, ctx);
                }

                // Wrap so widgets honor node styling (custom spacing, etc.),
                // which the widget components themselves don't read.
                return (
                    <div
                        className={
                            styleToClass(resolveStyle(node, ctx)) || undefined
                        }
                        style={styleToInline(resolveStyle(node, ctx))}
                    >
                        {spec.render(resolved, ctx)}
                    </div>
                );
            }
            case 'spacer':
                return <div className={SPACER_HEIGHT[node.size]} aria-hidden />;
            case 'divider':
                return (
                    <hr
                        className={cn(
                            'mx-auto my-6 w-16 border-[var(--inv-card-border)]',
                            styleToClass(resolveStyle(node, ctx)),
                        )}
                    />
                );
            case 'button': {
                const label = resolveValue(node.label, ctx);
                // Only the live page wires the open action; in the editor the
                // button is inert so clicks select it on the canvas instead.
                const onClick =
                    !ctx.editor && node.action !== 'none'
                        ? ctx.onOpen
                        : undefined;

                return (
                    <button
                        type="button"
                        onClick={onClick}
                        className={cn(
                            'inline-flex items-center justify-center gap-2 rounded-full bg-white/95 px-6 py-3 font-medium text-neutral-900 shadow-lg transition-colors hover:bg-white',
                            styleToClass(resolveStyle(node, ctx)),
                        )}
                        style={styleToInline(resolveStyle(node, ctx))}
                    >
                        {label || 'Buka Undangan'}
                    </button>
                );
            }
            case 'lottie': {
                const src = resolveValue(node.src, ctx);

                return (
                    <div
                        className={
                            styleToClass(resolveStyle(node, ctx)) || undefined
                        }
                        style={styleToInline(resolveStyle(node, ctx))}
                    >
                        <LottiePlayer
                            src={src}
                            loop={node.loop ?? true}
                            speed={node.speed ?? 1}
                        />
                    </div>
                );
            }
        }
    })();

    // Editor mode: real wrapper carrying the node id (for canvas click/drop
    // hit-testing) + a selection outline. Reveals are skipped so nothing stays
    // hidden while editing inside the scrollable preview panel.
    if (ctx.editor) {
        const drop =
            ctx.dropTargetId === node.id ? ctx.dropPosition : undefined;

        return (
            <div
                key={node.id}
                data-node-id={node.id}
                className={cn(
                    'relative outline-offset-[-1px] hover:outline hover:outline-1 hover:outline-brand/40',
                    ctx.selectedId === node.id &&
                        'outline outline-2 outline-brand',
                    drop === 'inside' &&
                        'outline-2 outline-brand outline-dashed',
                    drop === 'before' && 'border-t-2 border-brand',
                    drop === 'after' && 'border-b-2 border-brand',
                )}
            >
                {inner}
            </div>
        );
    }

    const ref = node.animationRef;

    if (ref?.reveal || ref?.revealSection) {
        // The couple's chosen per-section animation (if any) overrides the fallback.
        const coupleAnimation = ref.revealSection
            ? ctx.invitation.animations?.[ref.revealSection]
            : undefined;

        return (
            <AnimatedReveal
                key={node.id}
                animation={coupleAnimation}
                fallback={ref.reveal ?? 'fade'}
            >
                {inner}
            </AnimatedReveal>
        );
    }

    return (
        <div key={node.id} style={{ display: 'contents' }}>
            {inner}
        </div>
    );
}

export default function TemplateRenderer({
    layout,
    ctx,
}: {
    layout: TemplateLayout;
    ctx: RenderContext;
}) {
    return <>{renderNode(layout.root, ctx)}</>;
}
