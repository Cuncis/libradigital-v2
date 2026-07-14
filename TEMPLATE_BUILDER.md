# 🧱 Template Builder — Node Schema Spec

### Superadmin Feature · Elementor-style visual layout builder · v1 schema

> Superadmin designs the invitation page structure once, visually. The design is
> stored as a **node tree** (JSON) on the template. Every couple's invitation
> fills that tree with their own content via **bindings**.
>
> This document specifies **the node schema only** — the data contract between
> the builder (writer) and the `<TemplateRenderer>` (reader). It is the thing to
> review before any code is written. TypeScript in this doc is authoritative.

**Status:** SPEC / not implemented. See `ANIMATION_BUILDER.md` for the sibling
GSAP overlay system this reuses, and the phased plan for rollout.

**Decisions locked (2026-07-14):** superadmin-only · stack-based blocks (no
freeform absolute) · full-replacement rollout (Classic tree replaces the
hardcoded `PublicInvitationPage`, gated by a golden parity test).

---

## 1. Scope — what is and isn't in the tree

The tree describes the **scrollable body** of the invitation. Some things stay
as page **chrome**, rendered outside the tree by the page wrapper, because they
are cross-cutting and not "blocks":

| In the tree | Page chrome (outside the tree) |
|---|---|
| Hero, Countdown, Events, Story, Gallery, RSVP, Guest Book, Gift, Footer, any custom section/text/image | The opening **Cover** gate (`InvitationCover`) |
| Per-node reveal + floating animation packs | Background **music** `<audio>` |
| Theme-driven styling via `--inv-*` vars | `full_page` animation pack (fixed viewport overlay) |
| | `.invitation-scope` wrapper + theme CSS vars |

Rationale: the cover is a modal scroll-lock gate with its own lifecycle
(`opened`/`coverGone`), and music/full-page overlay are viewport-fixed. Wrapping
them in a flow-layout tree buys nothing. The renderer receives the tree for the
body; the wrapper keeps today's cover/music/overlay logic verbatim.

---

## 2. Terminology

| Term | Meaning |
|---|---|
| **Node** | One entry in the tree. Has a `type`, `style`, optional `children`. |
| **Widget** | A node that mounts an existing invitation React component (Countdown, RSVP…). |
| **Binding** | A value that resolves from the invitation at render time, not a literal the admin typed. |
| **Repeater** | A widget that renders one item per element of a bound array (gallery, gift, story). |
| **Context** | Runtime-only values that aren't invitation columns (guest name from `?tamu`, slug). |
| **Layout** | The whole tree, stored in `templates.layout` (JSON). |

---

## 3. The tree at a glance

```jsonc
{
  "version": 1,
  "root": {
    "id": "root",
    "type": "section",
    "style": { "variant": "hero" },
    "children": [
      {
        "id": "n_a1",
        "type": "text",
        "tag": "eyebrow",
        "value": { "kind": "literal", "value": "The Wedding Of" },
        "style": { "tracking": "widest", "case": "upper" }
      },
      {
        "id": "n_a2",
        "type": "text",
        "tag": "h1",
        "value": {
          "kind": "template",
          "parts": [
            { "kind": "bind", "field": "groom_name" },
            { "kind": "literal", "value": " & " },
            { "kind": "bind", "field": "bride_name" }
          ]
        },
        "style": { "font": "heading", "size": "5xl" }
      }
    ],
    "animationRef": { "reveal": "zoom" }
  }
}
```

The root is a single node (usually an invisible container holding the sections).
`version` mirrors `templates.builder_version` for migrations.

---

## 4. Node types (authoritative)

```ts
// resources/js/lib/template/nodes.ts

export type NodeType =
  | 'container'   // layout wrapper: stack | row | grid
  | 'section'     // full-bleed band; the top-level rhythm of the page
  | 'text'        // heading / paragraph / eyebrow — literal or bound
  | 'image'       // static asset OR bound (cover_photo, single gallery img)
  | 'widget'      // mounts an existing invitation component
  | 'spacer'      // vertical gap
  | 'divider';    // ornamental rule

export interface BaseNode {
  id: string;                       // nanoid(8), stable across edits
  type: NodeType;
  style: StyleProps;                // base (mobile-first) styling
  responsive?: {                    // overrides at breakpoints (see §8)
    sm?: Partial<StyleProps>;
    lg?: Partial<StyleProps>;
  };
  visibleWhen?: Visibility | null;  // conditional render (see §7)
  animationRef?: AnimationRef | null;
  children?: TreeNode[];            // only container | section carry children
}

export interface ContainerNode extends BaseNode {
  type: 'container';
  layout: 'stack' | 'row' | 'grid'; // stack = column; row = flex; grid = N cols
  columns?: number;                 // for layout:'grid' (default 2)
  gap?: SpacingToken;
  children: TreeNode[];
}

export interface SectionNode extends BaseNode {
  type: 'section';
  // Render-affecting preset for structural bands that tokens can't express:
  //   hero    → full-height band, optional cover-image bg + dark overlay, white-on-image
  //   footer  → top border + compact padding
  //   default → standard centered band
  variant?: 'hero' | 'default' | 'footer';
  backgroundImage?: Value | null;   // variant:'hero' cover image (usually bind cover_photo)
  children: TreeNode[];
}

export interface TextNode extends BaseNode {
  type: 'text';
  tag: 'eyebrow' | 'h1' | 'h2' | 'h3' | 'p';
  value: Value;                     // literal | bind | template (§5)
}

export interface ImageNode extends BaseNode {
  type: 'image';
  src: Value;                       // usually { kind:'bind', field:'cover_photo' }
  alt?: string;
  fit?: 'cover' | 'contain';
}

export interface WidgetNode extends BaseNode {
  type: 'widget';
  widget: WidgetKind;               // §6
  bindings: Record<string, Value>;  // prop name → value (validated per widget)
}

export interface SpacerNode extends BaseNode {
  type: 'spacer';
  size: SpacingToken;
}

export interface DividerNode extends BaseNode {
  type: 'divider';
  ornament?: boolean;               // theme ornament glyph vs. plain rule
}

export type TreeNode =
  | ContainerNode | SectionNode | TextNode
  | ImageNode | WidgetNode | SpacerNode | DividerNode;

export interface TemplateLayout {
  version: number;
  root: SectionNode | ContainerNode;
}
```

**Invariants** (enforced by a Zod schema on save, see §10):

1. `id` is unique across the whole tree.
2. Only `container` and `section` have `children`.
3. `section` nodes may not nest inside another `section` (one level of bands).
4. A `widget` node's `bindings` keys must exactly match that widget's contract.
5. The root is a `section` or `container`.

---

## 5. Values & bindings

Every user-facing string/URL is a `Value`, resolved by `resolveValue()`:

```ts
export type Value =
  | { kind: 'literal'; value: string }
  | { kind: 'bind'; field: BindableField; fallback?: string }
  | { kind: 'template'; parts: Value[] };   // concatenation (no nested template)

export function resolveValue(value: Value, ctx: RenderContext): string {
  switch (value.kind) {
    case 'literal':
      return value.value;
    case 'bind':
      return readField(ctx, value.field) ?? value.fallback ?? BIND_FALLBACK[value.field];
    case 'template':
      return value.parts.map((p) => resolveValue(p, ctx)).join('');
  }
}
```

- **literal** — admin typed it (labels: "The Wedding Of", "Konfirmasi Kehadiran").
- **bind** — pulls from the invitation/context; `fallback` overrides the default
  placeholder (e.g. "Nama Pengantin") when the field is empty (draft previews).
- **template** — one string from mixed parts (couple name = groom + " & " + bride).

### 5.1 Bindable fields (whitelist)

Derived 1:1 from `PublicInvitation` / `InvitationResource`. **Scalars only** here;
arrays are handled by repeater widgets (§6.2), not text bindings.

```ts
export type BindableField =
  // couple + date
  | 'groom_name' | 'bride_name' | 'wedding_date'
  // akad
  | 'akad_venue' | 'akad_address' | 'akad_datetime' | 'maps_url_akad'
  // resepsi
  | 'resepsi_venue' | 'resepsi_address' | 'resepsi_datetime' | 'maps_url_resepsi'
  // media + prose
  | 'cover_photo' | 'love_story' | 'music_url'
  // context (runtime, not invitation columns)
  | 'ctx.slug';        // invitation.slug — needed by widgets (rsvp/visitor/share)
// NOTE: the guest name (?tamu) is NOT a text-bindable field — it is owned by the
// `guest_greeting` widget (§6.4), which encapsulates the SSR + empty guards.
```

Field metadata (label, group, formatter, whether it's a date) lives in one
registry so the binding picker and the renderer agree:

```ts
export interface BindableFieldMeta {
  field: BindableField;
  label: string;             // "Nama Pria" — shown in the picker
  group: 'Pasangan' | 'Akad' | 'Resepsi' | 'Media' | 'Konteks';
  format?: 'date' | 'time' | 'datetime'; // applies formatIndoDate/Time at render
  placeholder: string;       // default fallback when empty
}
export const BINDABLE_FIELDS: BindableFieldMeta[];
```

> **Timezone note:** date fields format via the existing `lib/format.ts`
> (`formatIndoDate`/`formatIndoTime`) which treat datetimes as wall-clock UTC and
> append the WIB/WITA/WIT label from `invitation.timezone`. The renderer passes
> `timezone` through `RenderContext`; a `format:'time'` binding reads it. Admins
> never bind a raw datetime as plain text.

### 5.2 Render context

```ts
export interface RenderContext {
  invitation: PublicInvitation;   // the resource payload
  guestName: string;              // from useTamu() — '' until hydrated
  hydrated: boolean;              // SSR guard; guestName is '' pre-hydration
}
```

`guestName` is consumed only by the `guest_greeting`, `rsvp`, and `wa_share`
widgets — it is NOT a text-bindable field. Those widgets internally call
`useHydrated()`, so `guestName` reads `''` on the server and first client render
(SSR parity — see `libradigital-architecture` memory) and the greeting self-hides
when empty. No template author ever hand-wires the hydration guard, and no node
in the tree references the guest name directly.

---

## 6. Widget registry

Widgets are the **existing components, unchanged**. The registry maps a
`WidgetKind` to its component + its binding contract. No component rewrites.

```ts
export type WidgetKind =
  | 'countdown' | 'event' | 'love_story' | 'gallery'
  | 'rsvp' | 'guest_book' | 'gift' | 'visitor_counter' | 'wa_share'
  | 'guest_greeting';   // owns the ?tamu guest name + SSR/empty guards (§6.4)
```

### 6.1 Scalar widgets

| WidgetKind | Component | Binding contract (`bindings` keys → Value) | Notes |
|---|---|---|---|
| `countdown` | `Countdown` | `{ target: bind(wedding_date) }` | comp prop `targetIso`; hide if no date |
| `event` | `EventBlock` | `{ title: literal, datetime: bind, venue: bind, address: bind, mapsUrl: bind }` | placed twice (akad/resepsi) with different binds; `tz` from ctx |
| `love_story` | `LoveStoryTimeline` | `{ story: bind(love_story) }` | hide if empty |
| `rsvp` | `RsvpForm` | `{ slug: bind(ctx.slug) }` | adapter passes `defaultName = ctx.guestName` |
| `visitor_counter` | `VisitorCounter` | `{ slug: bind(ctx.slug) }` | |
| `wa_share` | `WaShareButton` | `{ slug: bind(ctx.slug) }` | adapter passes `guestName = ctx.guestName` |
| `guest_greeting` | greeting block | `{ variant: literal('card' \| 'inline') }` | see §6.4 — reads `ctx.guestName`, self-guards SSR + empty |

### 6.2 Repeater widgets (bound to arrays)

These iterate an invitation array. The admin lays out the **container**, not
individual items; the item template is fixed inside the component.

| WidgetKind | Component | Source array | Empty behavior |
|---|---|---|---|
| `gallery` | (grid of `<img>`) | `gallery_photos[]` | section hidden if empty |
| `gift` | `GiftCard` per item | `gift_accounts[]` | section hidden if empty |
| `guest_book` | `GuestBook` | `guest_book_entries[]` + `has_guest_book` gate | hidden unless add-on active |

Repeater arrays are **not** in the `BindableField` union — they're implicit to the
widget. A future enhancement could expose per-item sub-templates; out of scope v1.

### 6.3 Widget adapter

Each registry entry provides an adapter that turns resolved bindings + context
into the component's real props, so components keep their current signatures:

```ts
export interface WidgetSpec {
  kind: WidgetKind;
  label: string;                         // palette + inspector
  bindingSchema: Record<string, BindingRule>; // required/optional + allowed Value kinds
  isRepeater: boolean;
  defaultVisibleWhen?: Visibility;       // e.g. gift → notEmpty(gift_accounts)
  render: (resolved: Record<string, string>, ctx: RenderContext) => React.ReactNode;
}
export const WIDGET_REGISTRY: Record<WidgetKind, WidgetSpec>;
```

### 6.4 The `guest_greeting` widget (resolved §14.1)

The guest name (`?tamu` query param) is deliberately **not** a text-bindable
field. It couples three failure-prone concerns — the `useHydrated` SSR guard, the
empty guard, and specific markup — that a raw bind would push onto every template
author (one forgotten guard = an SSR hydration mismatch). The widget owns all three:

```ts
// bindings.variant selects the presentation; no field binding — reads ctx.guestName
type GuestGreetingVariant = 'card' | 'inline';
//   card   → hero: translucent boxed block ("Kepada Bapak/Ibu/Saudara/i" + name)
//   inline → RSVP intro: muted one-line paragraph
```

Behavior: renders `null` until `ctx.hydrated` AND `ctx.guestName !== ''`. This
reproduces today's `{tamu && …}` blocks in both the hero and the RSVP section
without any `visibleWhen` in the tree. It is the ONLY hydration-dependent node —
which is why the `visibility` union has no `hydrated` primitive (§7).

---

## 7. Conditional visibility

Invitations render sections conditionally (no countdown without a date, no gallery
without photos, guest book only with the add-on). The tree encodes this so the
Classic template reproduces today's `{cond && <Section>}` behavior exactly.

```ts
export type Visibility =
  | { when: 'notEmpty'; field: BindableField }        // string/date present
  | { when: 'arrayNotEmpty'; source: RepeaterSource } // gallery/gift/guest_book
  | { when: 'addon'; addon: 'guest_book' }            // maps to has_guest_book
  | { when: 'all'; of: Visibility[] }
  | { when: 'any'; of: Visibility[] };
```

`visibleWhen: null` (or absent) = always render. The renderer evaluates it before
rendering the node **and its subtree**. Default `visibleWhen` values are seeded
per widget from `WidgetSpec.defaultVisibleWhen` but are editable in the inspector.

---

## 8. Styling & responsive

`StyleProps` is a **constrained, token-based** style object — not arbitrary CSS.
This keeps output on-theme, mobile-safe, and diffable. Values are design tokens
that resolve to Tailwind classes / `--inv-*` vars, never raw px soup.

```ts
export type SpacingToken = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type SizeToken = 'xs'|'sm'|'base'|'lg'|'xl'|'2xl'|'3xl'|'4xl'|'5xl'|'6xl';

export interface StyleProps {
  align?: 'start' | 'center' | 'end';
  padding?: SpacingToken;
  margin?: SpacingToken;
  maxWidth?: 'prose' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full';
  background?: 'transparent' | 'card' | 'soft' | 'accent' | 'image';
  radius?: 'none' | 'sm' | 'md' | 'lg' | '2xl';
  // text-only
  font?: 'heading' | 'body';        // maps to --inv-font-heading / body
  size?: SizeToken;
  weight?: 'normal' | 'medium' | 'semibold';
  color?: 'default' | 'muted' | 'accent' | 'accent-strong' | 'white';
  tracking?: 'normal' | 'wide' | 'wider' | 'widest';
  case?: 'none' | 'upper';
}
```

- **Mobile-first:** base `style` targets the smallest screen; `responsive.sm` /
  `responsive.lg` shallow-merge over it. Because layout is **stack-based**, most
  templates need zero responsive overrides — this is the payoff of that decision.
- **Theme-driven color:** `color`/`background` tokens resolve to `var(--inv-*)`,
  so one tree restyles automatically across javanese/sundanese/modern/rose themes.
- **No absolute positioning, no raw px.** Enforced by the type + save validation.

---

## 9. Animation integration (reuse of ANIMATION_BUILDER)

Per-node animation reuses both existing systems — nothing new rendered here:

```ts
export interface AnimationRef {
  reveal?: AnimationEffect | null;  // scroll reveal via <AnimatedReveal>
  packSlug?: string | null;         // floating GSAP overlay via <AnimationLayer>
}
```

- `reveal` → wraps the node in your existing `AnimatedReveal` (fade/slide/zoom).
  At render time the actual effect can still be overridden by the couple's
  `invitation.animations[section]` selection, preserving current behavior.
- `packSlug` → the couple's chosen `animation_pack` still wins at the invitation
  level (one pack, one section). The template's `packSlug` is a **default/suggestion**
  the couple's selection overrides. Full-page packs remain page chrome (§1).

> The node schema only *references* animations by id/effect. Motion presets,
> upload, and the pack builder are entirely `ANIMATION_BUILDER.md`'s domain.

---

## 10. Persistence, versioning & validation

- **Storage:** `templates.layout` = `TemplateLayout` JSON (cast `array`).
  `templates.builder_version` = `int`, mirrors `layout.version`.
- **Whole-tree read/write.** No per-node table (unlike `animation_assets`): trees
  are read whole, written whole, never queried by inner node.
- **Validation on save (backend):** a Laravel `FormRequest` + a shared JSON-schema
  check rejects trees that violate §4 invariants, unknown `BindableField`s, unknown
  `WidgetKind`s, or binding keys that don't match a widget's `bindingSchema`.
  Mirror the rules with **Zod** on the client so the builder blocks bad saves early.
- **Migrations:** when the schema changes, bump `version` and write a pure
  `migrate(v_n → v_n+1)` function over the JSON. Old templates upgrade lazily on
  load. `builder_version` lets the renderer pick the right migrator chain.
- **Null layout:** during the build-out, `layout === null` means "not yet migrated."
  Because rollout is **full replacement**, the deploy that flips the route also
  backfills every template (only the seeded Classic exists at that point), so
  `null` should not survive into production. The renderer still guards against it.

---

## 11. Worked example — the "Classic" template (excerpt)

The Phase-1 parity target: this tree must render identically to today's
`PublicInvitationPage`. Hero + Events shown; the full seed lives in the seeder.

```jsonc
{
  "version": 1,
  "root": {
    "id": "root", "type": "container", "layout": "stack", "style": {},
    "children": [
      {
        "id": "sec_hero", "type": "section", "variant": "hero",
        "backgroundImage": { "kind": "bind", "field": "cover_photo" },
        "style": { "align": "center" },
        "animationRef": { "reveal": "zoom", "packSlug": null },
        "children": [
          { "id": "hero_eyebrow", "type": "text", "tag": "eyebrow",
            "value": { "kind": "literal", "value": "The Wedding Of" },
            "style": { "case": "upper", "tracking": "widest", "color": "white" } },
          { "id": "hero_names", "type": "text", "tag": "h1",
            "value": { "kind": "template", "parts": [
              { "kind": "bind", "field": "groom_name" },
              { "kind": "literal", "value": " & " },
              { "kind": "bind", "field": "bride_name" }
            ] },
            "style": { "font": "heading", "size": "5xl", "color": "white" } },
          { "id": "hero_date", "type": "text", "tag": "p",
            "value": { "kind": "bind", "field": "wedding_date" },
            "style": { "color": "white", "size": "lg" },
            "visibleWhen": { "when": "notEmpty", "field": "wedding_date" } },
          { "id": "hero_greeting", "type": "widget", "widget": "guest_greeting",
            "bindings": { "variant": { "kind": "literal", "value": "card" } },
            "style": {} }
        ]
      },
      {
        "id": "sec_countdown", "type": "section", "variant": "default",
        "visibleWhen": { "when": "notEmpty", "field": "wedding_date" },
        "animationRef": { "reveal": "fade" },
        "style": { "align": "center" },
        "children": [
          { "id": "cd_title", "type": "text", "tag": "h2",
            "value": { "kind": "literal", "value": "Menuju Hari Bahagia" },
            "style": { "font": "heading", "color": "accent-strong" } },
          { "id": "cd_widget", "type": "widget", "widget": "countdown",
            "bindings": { "target": { "kind": "bind", "field": "wedding_date" } },
            "style": {} }
        ]
      },
      {
        "id": "sec_events", "type": "section", "variant": "default",
        "style": {}, "animationRef": { "packSlug": null },
        "children": [
          { "id": "events_grid", "type": "container", "layout": "grid",
            "columns": 2, "gap": "md", "style": {},
            "children": [
              { "id": "ev_akad", "type": "widget", "widget": "event", "style": {},
                "bindings": {
                  "title":   { "kind": "literal", "value": "Akad Nikah" },
                  "datetime":{ "kind": "bind", "field": "akad_datetime" },
                  "venue":   { "kind": "bind", "field": "akad_venue" },
                  "address": { "kind": "bind", "field": "akad_address" },
                  "mapsUrl": { "kind": "bind", "field": "maps_url_akad" }
                } },
              { "id": "ev_resepsi", "type": "widget", "widget": "event", "style": {},
                "bindings": {
                  "title":   { "kind": "literal", "value": "Resepsi" },
                  "datetime":{ "kind": "bind", "field": "resepsi_datetime" },
                  "venue":   { "kind": "bind", "field": "resepsi_venue" },
                  "address": { "kind": "bind", "field": "resepsi_address" },
                  "mapsUrl": { "kind": "bind", "field": "maps_url_resepsi" }
                } }
            ] }
        ]
      }
      // … story, gallery, rsvp, guest_book, gift, wa_share, footer
    ]
  }
}
```

---

## 12. Renderer contract

```ts
// resources/js/components/invitation/TemplateRenderer.tsx
export function TemplateRenderer({
  layout, ctx,
}: { layout: TemplateLayout; ctx: RenderContext }): React.ReactNode;
```

Rules the renderer MUST obey (these are the parity guarantees):

1. **Pure & deterministic** given `(layout, ctx)` — no data fetching, SSR-safe.
2. Evaluate `visibleWhen` before rendering a node; a hidden node renders nothing
   (not an empty wrapper) — matches today's conditional sections.
3. Resolve every `Value` through `resolveValue`, applying `format` for date fields.
4. Wrap a node in `AnimatedReveal` iff `animationRef.reveal`; mount `AnimationLayer`
   iff a pack applies to that section (couple selection overrides template default).
5. **The same component powers the builder canvas** (wrapped with selection chrome)
   so editor and public output can never drift.

---

## 13. Non-goals (v1)

- ❌ End-user editing (superadmin only).
- ❌ Freeform absolute positioning / drag-anywhere.
- ❌ Arbitrary CSS or raw px; only tokens in `StyleProps`.
- ❌ Per-item repeater sub-templates (gallery/gift item layouts are fixed).
- ❌ Custom fonts/colors beyond the theme `--inv-*` system.
- ❌ Multiple animation packs per section (unchanged: one pack, one section).
- ❌ Undo/redo, reusable saved blocks — later phases, not schema concerns.

---

## 14. Resolved decisions (2026-07-14)

1. **Guest name → dedicated `guest_greeting` widget** (not a text bind). It owns
   the `useHydrated` SSR guard + empty guard + markup so no template author can
   forget them. Consequence: `ctx.guest_name` is removed from `BindableField`, and
   the `when:'hydrated'` visibility primitive is dropped (nothing else needs it).
   See §6.4.
2. **Events → two explicit `event` widgets**, not a repeater. Akad/Resepsi are two
   distinctly-bound, distinctly-labeled blocks, not a dynamic array. Each may carry
   an optional `visibleWhen` for single-ceremony invitations; the Classic seed
   leaves it null to match today's always-render-both behavior. Repeaters remain
   reserved for genuinely dynamic arrays (gallery/gift/guest_book).
3. **`section.variant` kept as a render-affecting preset** (`hero | default |
   footer`; `'muted'` dropped — use `background:'soft'`). The hero band's structure
   (full-height, cover-image bg + dark overlay, white-on-image) can't be expressed
   in token-only `StyleProps` without polluting every node's style type. The hero
   cover image moves onto `SectionNode.backgroundImage`, so the standalone `hero_bg`
   ImageNode is gone from the Classic tree (§11).

---

*TEMPLATE_BUILDER.md — LibraDigital · schema v1 · 2026-07-14*
*Companion to ANIMATION_BUILDER.md. Reviewed before implementation.*
