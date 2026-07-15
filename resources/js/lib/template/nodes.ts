/**
 * Template Builder — node schema (v1).
 *
 * The authoritative data contract between the visual builder (writer) and the
 * `<TemplateRenderer>` (reader). Stored whole as JSON on `templates.layout`.
 * See TEMPLATE_BUILDER.md for the prose spec.
 */
import type {
    AnimationEffect,
    AnimationPackSectionType,
    AnimationSection,
} from '@/types/invitation';
import type { BindableField } from './bindableFields';

// --- Values & bindings (§5) -------------------------------------------------

/** How a date/time binding is formatted when resolved into display text. */
export type BindFormat = 'date' | 'time' | 'datetime';

/**
 * A user-facing string/URL. Either a literal the admin typed, a binding pulled
 * from the invitation at render time, or a concatenation of parts.
 */
export type Value =
    | { kind: 'literal'; value: string }
    | {
          kind: 'bind';
          field: BindableField;
          fallback?: string;
          /** Formats date-ish fields for text display; omit for raw values (widgets). */
          format?: BindFormat;
      }
    | { kind: 'template'; parts: Value[] };

// --- Conditional visibility (§7) --------------------------------------------

export type RepeaterSource =
    'gallery_photos' | 'gift_accounts' | 'guest_book_entries';

export type Visibility =
    | { when: 'notEmpty'; field: BindableField }
    | { when: 'arrayNotEmpty'; source: RepeaterSource }
    | { when: 'addon'; addon: 'guest_book' }
    | { when: 'all'; of: Visibility[] }
    | { when: 'any'; of: Visibility[] };

// --- Styling tokens (§8) ----------------------------------------------------

export type SpacingToken = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type SizeToken =
    'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';

/** Custom per-side spacing in pixels. Any omitted side falls back to the token. */
export interface SpacingSides {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
}

export interface StyleProps {
    align?: 'start' | 'center' | 'end';
    padding?: SpacingToken;
    margin?: SpacingToken;
    /** Custom per-side padding (px). Overrides the `padding` token per side. */
    paddingPx?: SpacingSides;
    /** Custom per-side margin (px). Overrides the `margin` token per side. */
    marginPx?: SpacingSides;
    maxWidth?: 'prose' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full';
    background?: 'transparent' | 'card' | 'soft' | 'accent' | 'image';
    radius?: 'none' | 'sm' | 'md' | 'lg' | '2xl';
    // text-only
    font?: 'heading' | 'body';
    size?: SizeToken;
    weight?: 'normal' | 'medium' | 'semibold';
    color?: 'default' | 'muted' | 'accent' | 'accent-strong' | 'white';
    tracking?: 'normal' | 'wide' | 'wider' | 'widest';
    case?: 'none' | 'upper';
}

// --- Animation reference (§9) -----------------------------------------------

export interface AnimationRef {
    /** Scroll-reveal effect via <AnimatedReveal> (fallback when no couple override). */
    reveal?: AnimationEffect | null;
    /**
     * Maps this node to a couple-customizable animation slot. When set, the couple's
     * `invitation.animations[revealSection]` selection overrides `reveal` at render.
     */
    revealSection?: AnimationSection | null;
    /**
     * Marks a section node as a floating-overlay region. When the couple's chosen
     * pack (invitation.animation_pack) targets this same section, its <AnimationLayer>
     * is rendered over this node. (Only honored on section nodes.)
     */
    packSection?: AnimationPackSectionType | null;
}

// --- Nodes (§4) -------------------------------------------------------------

export type NodeType =
    | 'container'
    | 'section'
    | 'text'
    | 'image'
    | 'widget'
    | 'spacer'
    | 'divider';

export type WidgetKind =
    | 'countdown'
    | 'event'
    | 'love_story'
    | 'gallery'
    | 'rsvp'
    | 'guest_book'
    | 'gift'
    | 'visitor_counter'
    | 'wa_share'
    | 'guest_greeting';

export interface BaseNode {
    id: string;
    type: NodeType;
    style: StyleProps;
    responsive?: {
        sm?: Partial<StyleProps>;
        lg?: Partial<StyleProps>;
    };
    visibleWhen?: Visibility | null;
    animationRef?: AnimationRef | null;
    children?: TreeNode[];
}

export interface ContainerNode extends BaseNode {
    type: 'container';
    layout: 'stack' | 'row' | 'grid';
    columns?: number;
    gap?: SpacingToken;
    children: TreeNode[];
}

export interface SectionNode extends BaseNode {
    type: 'section';
    variant?: 'hero' | 'default' | 'footer';
    /** Cover image for variant:'hero' (usually bind cover_photo). */
    backgroundImage?: Value | null;
    children: TreeNode[];
}

export interface TextNode extends BaseNode {
    type: 'text';
    tag: 'eyebrow' | 'h1' | 'h2' | 'h3' | 'p';
    value: Value;
}

export interface ImageNode extends BaseNode {
    type: 'image';
    src: Value;
    alt?: string;
    fit?: 'cover' | 'contain';
}

export interface WidgetNode extends BaseNode {
    type: 'widget';
    widget: WidgetKind;
    bindings: Record<string, Value>;
}

export interface SpacerNode extends BaseNode {
    type: 'spacer';
    size: SpacingToken;
}

export interface DividerNode extends BaseNode {
    type: 'divider';
    ornament?: boolean;
}

export type TreeNode =
    | ContainerNode
    | SectionNode
    | TextNode
    | ImageNode
    | WidgetNode
    | SpacerNode
    | DividerNode;

export interface TemplateLayout {
    version: number;
    root: SectionNode | ContainerNode;
}
