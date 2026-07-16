import { Head, router } from '@inertiajs/react';
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    ArrowLeft,
    BookOpen,
    CalendarHeart,
    ChevronDown,
    ChevronRight,
    ChevronsDownUp,
    ChevronsUpDown,
    ChevronUp,
    ClipboardCheck,
    ClipboardPaste,
    Columns3,
    Container,
    Copy,
    ExternalLink,
    Eye,
    Gift,
    Grid2x2,
    HeartHandshake,
    Image,
    Images,
    LayoutList,
    Loader2,
    MailOpen,
    Minus,
    Monitor,
    MousePointerClick,
    MoveVertical,
    Pencil,
    Rows3,
    Save,
    Share2,
    Smartphone,
    Sparkles,
    Square,
    Timer,
    Trash2,
    Type,
    Upload,
    UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import TemplateRenderer from '@/components/invitation/TemplateRenderer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BINDABLE_FIELDS } from '@/lib/template/bindableFields';
import type { BindableField } from '@/lib/template/bindableFields';
import type {
    Device,
    NodeType,
    ResponsiveOverride,
    SpacingSides,
    StyleProps,
    TemplateLayout,
    TreeNode,
    Value,
    Visibility,
    WidgetKind,
} from '@/lib/template/nodes';
import {
    cloneWithNewIds,
    createNode,
    findNode,
    insertNode,
    insertRelative,
    moveNode,
    moveRelative,
    nodeLabel,
    removeNode,
    updateNode,
} from '@/lib/template/tree';
import type { DropPosition } from '@/lib/template/tree';
import { WIDGET_REGISTRY } from '@/lib/template/widgets';
import { resolveTheme } from '@/lib/themes';
import { cn } from '@/lib/utils';
import admin from '@/routes/admin';
import type { InvitationTemplate, PublicInvitation } from '@/types/invitation';

interface Props {
    template: InvitationTemplate & {
        layout: TemplateLayout;
        cover: TemplateLayout;
    };
    sampleInvitation: PublicInvitation;
}

/** Which tree the builder is editing: the invitation body or the cover screen. */
type BuilderTab = 'body' | 'cover';

const REVEAL_OPTIONS = [
    'fade',
    'slide_up',
    'slide_left',
    'slide_right',
    'zoom',
];
// Overlay regions a couple's floating pack can target (full_page is page chrome).
const PACK_SECTIONS = ['hero', 'gallery', 'story', 'event', 'footer'];
const WIDGET_KINDS = Object.keys(WIDGET_REGISTRY) as WidgetKind[];

const WIDGET_ICONS: Record<WidgetKind, LucideIcon> = {
    countdown: Timer,
    event: CalendarHeart,
    love_story: HeartHandshake,
    gallery: Images,
    rsvp: ClipboardCheck,
    guest_book: BookOpen,
    gift: Gift,
    visitor_counter: Eye,
    wa_share: Share2,
    guest_greeting: UserRound,
};

const ELEMENTS: { type: NodeType; label: string; icon: LucideIcon }[] = [
    { type: 'section', label: 'Section', icon: Square },
    { type: 'container', label: 'Container', icon: Container },
    { type: 'text', label: 'Text', icon: Type },
    { type: 'image', label: 'Image', icon: Image },
    { type: 'spacer', label: 'Spacer', icon: MoveVertical },
    { type: 'divider', label: 'Divider', icon: Minus },
];

// Extra elements surfaced on the Cover tab: the open button + a Lottie layer.
const COVER_ELEMENTS: { type: NodeType; label: string; icon: LucideIcon }[] = [
    { type: 'button', label: 'Tombol', icon: MousePointerClick },
    { type: 'lottie', label: 'Lottie', icon: Sparkles },
];

const MOTION_OPTIONS: { value: string; label: string }[] = [
    { value: '', label: 'diam' },
    { value: 'sway', label: 'goyang' },
    { value: 'float', label: 'melayang' },
    { value: 'drift', label: 'geser' },
    { value: 'pulse', label: 'denyut' },
    { value: 'spin', label: 'putar' },
];

/** Preview canvas width per device — mobile mimics a phone, desktop is wider. */
const DEVICE_WIDTH: Record<Device, number> = {
    desktop: 720,
    mobile: 400,
};

/** What is being dragged: an existing node (reorder) or a new element (from palette). */
type DragPayload =
    | { kind: 'move'; id: string }
    | { kind: 'new'; type: NodeType; widget?: WidgetKind };

interface DropTarget {
    id: string;
    position: DropPosition;
}

// --- Small inspector controls ------------------------------------------------

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            {children}
        </div>
    );
}

/** Small pill showing which device layer the inspector is currently editing. */
function DeviceBadge({ device }: { device: Device }) {
    const mobile = device === 'mobile';

    return (
        <span
            className={cn(
                'flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium',
                mobile
                    ? 'bg-brand/10 text-brand'
                    : 'bg-muted text-muted-foreground',
            )}
        >
            {mobile ? (
                <Smartphone className="size-3" />
            ) : (
                <Monitor className="size-3" />
            )}
            {mobile ? 'Mobile' : 'Desktop'}
        </span>
    );
}

/** A visual palette tile: icon on top, label below. Click to add or drag to place. */
function PaletteCard({
    label,
    icon: Icon,
    dragData,
    payload,
    onSetDrag,
    onEndDrag,
    onAdd,
}: {
    label: string;
    icon: LucideIcon;
    dragData: string;
    payload: DragPayload;
    onSetDrag: (p: DragPayload) => void;
    onEndDrag: () => void;
    onAdd: () => void;
}) {
    return (
        <button
            type="button"
            title={label}
            draggable
            onDragStart={(e) => {
                // 'copyMove' so the layer-tree rows (dropEffect 'move') accept it.
                e.dataTransfer.setData('text/plain', dragData);
                e.dataTransfer.effectAllowed = 'copyMove';
                onSetDrag(payload);
            }}
            onDragEnd={onEndDrag}
            onClick={onAdd}
            className="flex cursor-grab flex-col items-center gap-1 rounded-md border border-input bg-background px-1 py-2.5 text-center transition-colors hover:border-brand hover:bg-muted"
        >
            <Icon className="size-5 text-brand" />
            <span className="text-[10px] leading-tight text-muted-foreground">
                {label}
            </span>
        </button>
    );
}

function Select({
    value,
    onChange,
    options,
}: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
            {options.map((o) => (
                <option key={o.value} value={o.value}>
                    {o.label}
                </option>
            ))}
        </select>
    );
}

function opt(values: readonly string[], noneLabel?: string) {
    const base = values.map((v) => ({ value: v, label: v }));

    return noneLabel ? [{ value: '', label: noneLabel }, ...base] : base;
}

interface OptionItem {
    value: string;
    label?: string;
    icon?: LucideIcon;
    title?: string;
}

/**
 * Segmented option picker: clickable icon/label buttons instead of a dropdown.
 * When `allowClear` is set, clicking the active option deselects it (emits '').
 */
function OptionGroup({
    value,
    onChange,
    options,
    allowClear = false,
}: {
    value: string;
    onChange: (v: string) => void;
    options: OptionItem[];
    allowClear?: boolean;
}) {
    return (
        <div className="flex flex-wrap gap-1">
            {options.map((o) => {
                const active = value !== '' && o.value === value;
                const Icon = o.icon;

                return (
                    <button
                        key={o.value}
                        type="button"
                        title={o.title ?? o.label ?? o.value}
                        aria-pressed={active}
                        onClick={() =>
                            onChange(allowClear && active ? '' : o.value)
                        }
                        className={cn(
                            'flex h-8 items-center justify-center gap-1 rounded-md border px-2 text-xs capitalize transition-colors',
                            Icon ? 'min-w-9' : 'min-w-8',
                            active
                                ? 'border-brand bg-brand/10 font-medium text-brand'
                                : 'border-input bg-background text-foreground hover:bg-muted',
                        )}
                    >
                        {Icon ? (
                            <Icon className="size-4" />
                        ) : (
                            (o.label ?? o.value)
                        )}
                    </button>
                );
            })}
        </div>
    );
}

const SPACING_SIDES: { key: keyof SpacingSides; label: string }[] = [
    { key: 'top', label: 'Atas' },
    { key: 'right', label: 'Kanan' },
    { key: 'bottom', label: 'Bawah' },
    { key: 'left', label: 'Kiri' },
];

/** Four number inputs (top/right/bottom/left) for custom px spacing. */
function SidesInput({
    value,
    onChange,
}: {
    value: SpacingSides | undefined;
    onChange: (v: SpacingSides | undefined) => void;
}) {
    const setSide = (key: keyof SpacingSides, raw: string) => {
        const next: SpacingSides = {
            ...value,
            [key]: raw === '' ? undefined : Number(raw),
        };
        const cleaned = Object.fromEntries(
            Object.entries(next).filter(
                ([, v]) => typeof v === 'number' && !Number.isNaN(v),
            ),
        ) as SpacingSides;

        onChange(Object.keys(cleaned).length > 0 ? cleaned : undefined);
    };

    return (
        <div className="grid grid-cols-4 gap-1">
            {SPACING_SIDES.map((s) => (
                <div key={s.key} className="grid gap-0.5">
                    <Input
                        type="number"
                        value={value?.[s.key] ?? ''}
                        onChange={(e) => setSide(s.key, e.target.value)}
                        placeholder="0"
                        className="h-8 px-1 text-center text-xs"
                    />
                    <span className="text-center text-[10px] text-muted-foreground">
                        {s.label}
                    </span>
                </div>
            ))}
        </div>
    );
}

const STYLE_TOKENS: {
    key: keyof StyleProps;
    label: string;
    values: readonly string[];
    icons?: Record<string, LucideIcon>;
}[] = [
    {
        key: 'align',
        label: 'Rata',
        values: ['start', 'center', 'end'],
        icons: {
            start: AlignLeft,
            center: AlignCenter,
            end: AlignRight,
        },
    },
    {
        key: 'size',
        label: 'Ukuran',
        values: [
            'xs',
            'sm',
            'base',
            'lg',
            'xl',
            '2xl',
            '3xl',
            '4xl',
            '5xl',
            '6xl',
        ],
    },
    {
        key: 'weight',
        label: 'Ketebalan',
        values: ['normal', 'medium', 'semibold'],
    },
    { key: 'font', label: 'Font', values: ['heading', 'body'] },
    {
        key: 'color',
        label: 'Warna',
        values: ['default', 'muted', 'accent', 'accent-strong', 'white'],
    },
    {
        key: 'tracking',
        label: 'Spasi Huruf',
        values: ['normal', 'wide', 'wider', 'widest'],
    },
    { key: 'case', label: 'Kapital', values: ['none', 'upper'] },
    {
        key: 'background',
        label: 'Latar',
        values: ['transparent', 'card', 'soft', 'accent'],
    },
    {
        key: 'maxWidth',
        label: 'Lebar Maks',
        values: ['prose', 'md', 'lg', 'xl', '2xl', '4xl', 'full'],
    },
];

function ValueEditor({
    value,
    onChange,
}: {
    value: Value;
    onChange: (v: Value) => void;
}) {
    if (value.kind === 'template') {
        return (
            <p className="text-xs text-muted-foreground">
                Nilai gabungan ({value.parts.length} bagian) — mis. nama
                pasangan.
            </p>
        );
    }

    return (
        <div className="grid gap-1.5">
            <OptionGroup
                value={value.kind}
                onChange={(k) =>
                    onChange(
                        k === 'literal'
                            ? {
                                  kind: 'literal',
                                  value:
                                      value.kind === 'literal'
                                          ? value.value
                                          : '',
                              }
                            : { kind: 'bind', field: 'groom_name' },
                    )
                }
                options={[
                    { value: 'literal', label: 'Teks manual' },
                    { value: 'bind', label: 'Ambil dari data' },
                ]}
            />
            {value.kind === 'literal' ? (
                <Input
                    value={value.value}
                    onChange={(e) =>
                        onChange({ kind: 'literal', value: e.target.value })
                    }
                />
            ) : (
                <>
                    <Select
                        value={value.field}
                        onChange={(f) =>
                            onChange({ ...value, field: f as BindableField })
                        }
                        options={BINDABLE_FIELDS.map((f) => ({
                            value: f.field,
                            label: f.label,
                        }))}
                    />
                    <OptionGroup
                        value={value.format ?? 'raw'}
                        onChange={(fmt) =>
                            onChange({
                                ...value,
                                format:
                                    fmt === 'raw'
                                        ? undefined
                                        : (fmt as 'date' | 'time' | 'datetime'),
                            })
                        }
                        options={[
                            { value: 'raw', label: 'mentah' },
                            { value: 'date', label: 'tanggal' },
                            { value: 'time', label: 'jam' },
                            { value: 'datetime', label: 'tgl & jam' },
                        ]}
                    />
                </>
            )}
        </div>
    );
}

/** A source picker (literal URL / binding) with an inline file-upload button. */
function AssetInput({
    value,
    onChange,
    accept,
    uploading,
    onUpload,
}: {
    value: Value;
    onChange: (v: Value) => void;
    accept: string;
    uploading: boolean;
    onUpload: (file: File) => Promise<string | null>;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="grid gap-1.5">
            <ValueEditor value={value} onChange={onChange} />
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';

                    if (!file) {
                        return;
                    }

                    const url = await onUpload(file);

                    if (url) {
                        onChange({ kind: 'literal', value: url });
                    }
                }}
            />
            <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
            >
                {uploading ? (
                    <Loader2 className="size-4 animate-spin" />
                ) : (
                    <Upload className="size-4" />
                )}
                {uploading ? 'Mengunggah…' : 'Unggah file'}
            </Button>
        </div>
    );
}

function VisibilityEditor({
    value,
    onChange,
}: {
    value: Visibility | null | undefined;
    onChange: (v: Visibility | null) => void;
}) {
    const kind = value?.when ?? 'always';

    return (
        <div className="grid gap-1.5">
            <OptionGroup
                value={kind}
                onChange={(k) => {
                    if (k === 'always') {
                        onChange(null);
                    } else if (k === 'notEmpty') {
                        onChange({ when: 'notEmpty', field: 'wedding_date' });
                    } else if (k === 'arrayNotEmpty') {
                        onChange({
                            when: 'arrayNotEmpty',
                            source: 'gallery_photos',
                        });
                    } else {
                        onChange({ when: 'addon', addon: 'guest_book' });
                    }
                }}
                options={[
                    { value: 'always', label: 'Selalu tampil' },
                    { value: 'notEmpty', label: 'Jika field terisi' },
                    { value: 'arrayNotEmpty', label: 'Jika daftar terisi' },
                    { value: 'addon', label: 'Add-on buku tamu' },
                ]}
            />
            {value?.when === 'notEmpty' && (
                <Select
                    value={value.field}
                    onChange={(f) =>
                        onChange({
                            when: 'notEmpty',
                            field: f as BindableField,
                        })
                    }
                    options={BINDABLE_FIELDS.map((f) => ({
                        value: f.field,
                        label: f.label,
                    }))}
                />
            )}
            {value?.when === 'arrayNotEmpty' && (
                <Select
                    value={value.source}
                    onChange={(s) =>
                        onChange({
                            when: 'arrayNotEmpty',
                            source: s as typeof value.source,
                        })
                    }
                    options={opt([
                        'gallery_photos',
                        'gift_accounts',
                        'guest_book_entries',
                    ])}
                />
            )}
        </div>
    );
}

// --- Layer tree --------------------------------------------------------------

interface LayerRowProps {
    node: TreeNode;
    depth: number;
    selectedId: string | null;
    onSelect: (id: string) => void;
    dropTarget: DropTarget | null;
    collapsed: Set<string>;
    onToggle: (id: string) => void;
    onRowDragStart: (id: string) => void;
    onRowDragOver: (node: TreeNode, position: DropPosition) => void;
    onRowDrop: () => void;
    onDragEnd: () => void;
    onContextMenu: (node: TreeNode, x: number, y: number) => void;
    renamingId: string | null;
    onRenameCommit: (id: string, name: string) => void;
    onRenameCancel: () => void;
}

interface MenuItem {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
    disabled?: boolean;
    danger?: boolean;
}

/** Floating right-click menu positioned at the cursor. */
function ContextMenu({
    x,
    y,
    items,
    onClose,
}: {
    x: number;
    y: number;
    items: MenuItem[];
    onClose: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('mousedown', onDown);
        window.addEventListener('keydown', onKey);
        window.addEventListener('scroll', onClose, true);

        return () => {
            window.removeEventListener('mousedown', onDown);
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('scroll', onClose, true);
        };
    }, [onClose]);

    // Keep the menu inside the viewport.
    const left = Math.min(x, window.innerWidth - 184);
    const top = Math.min(y, window.innerHeight - 24 - items.length * 34);

    return (
        <div
            ref={ref}
            className="fixed z-50 min-w-44 overflow-hidden rounded-md border border-input bg-background py-1 text-sm shadow-md"
            style={{ top, left }}
        >
            {items.map((item) => (
                <button
                    key={item.label}
                    type="button"
                    disabled={item.disabled}
                    onClick={() => {
                        item.onClick();
                        onClose();
                    }}
                    className={cn(
                        'flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-muted disabled:pointer-events-none disabled:opacity-40',
                        item.danger && 'text-destructive',
                    )}
                >
                    <item.icon className="size-4" />
                    {item.label}
                </button>
            ))}
        </div>
    );
}

/** Inline rename box shown in place of a layer row while renaming. */
function RenameInput({
    node,
    depth,
    onCommit,
    onCancel,
}: {
    node: TreeNode;
    depth: number;
    onCommit: (id: string, name: string) => void;
    onCancel: () => void;
}) {
    const cancelled = useRef(false);

    return (
        <div
            className="py-0.5 pr-2"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
            <input
                autoFocus
                defaultValue={node.name ?? ''}
                placeholder={nodeLabel(node)}
                onFocus={(e) => e.currentTarget.select()}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.currentTarget.blur();
                    } else if (e.key === 'Escape') {
                        cancelled.current = true;
                        e.currentTarget.blur();
                    }
                }}
                onBlur={(e) =>
                    cancelled.current
                        ? onCancel()
                        : onCommit(node.id, e.currentTarget.value)
                }
                className="h-7 w-full rounded border border-brand bg-background px-2 text-sm outline-none"
            />
        </div>
    );
}

function LayerRow(props: LayerRowProps) {
    const { node, depth, selectedId, onSelect, dropTarget, collapsed } = props;
    const isRoot = depth === 0;
    const canInside = node.type === 'section' || node.type === 'container';
    const indicator = dropTarget?.id === node.id ? dropTarget.position : null;
    const hasChildren = (node.children?.length ?? 0) > 0;
    const isCollapsed = collapsed.has(node.id);
    const isRenaming = props.renamingId === node.id;

    return (
        <>
            {isRenaming ? (
                <RenameInput
                    node={node}
                    depth={depth}
                    onCommit={props.onRenameCommit}
                    onCancel={props.onRenameCancel}
                />
            ) : (
                <button
                    type="button"
                    draggable={!isRoot}
                    onClick={() => onSelect(node.id)}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        onSelect(node.id);
                        props.onContextMenu(node, e.clientX, e.clientY);
                    }}
                    onDragStart={(e) => {
                        e.stopPropagation();
                        // Required for the drag to start in Firefox.
                        e.dataTransfer.setData('text/plain', node.id);
                        e.dataTransfer.effectAllowed = 'move';
                        props.onRowDragStart(node.id);
                    }}
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        const rect = e.currentTarget.getBoundingClientRect();
                        const y = e.clientY - rect.top;
                        const position: DropPosition =
                            canInside &&
                            y > rect.height * 0.33 &&
                            y < rect.height * 0.67
                                ? 'inside'
                                : y < rect.height / 2
                                  ? 'before'
                                  : 'after';
                        props.onRowDragOver(node, position);
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        props.onRowDrop();
                    }}
                    onDragEnd={props.onDragEnd}
                    className={cn(
                        'flex w-full cursor-grab items-center gap-1.5 rounded px-2 py-1 text-left text-sm hover:bg-muted',
                        // Rows with children (collapsible groups) read as headers;
                        // leaf rows are lighter so the hierarchy is obvious.
                        hasChildren
                            ? 'bg-muted/40 font-semibold text-foreground'
                            : 'text-muted-foreground',
                        selectedId === node.id &&
                            'bg-muted font-medium ring-1 ring-brand',
                        indicator === 'inside' &&
                            'bg-brand/5 ring-2 ring-brand ring-inset',
                        indicator === 'before' && 'border-t-2 border-brand',
                        indicator === 'after' && 'border-b-2 border-brand',
                    )}
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                >
                    {hasChildren ? (
                        <span
                            role="button"
                            tabIndex={-1}
                            aria-label={isCollapsed ? 'Perluas' : 'Ciutkan'}
                            onClick={(e) => {
                                // Toggle without selecting/dragging the row.
                                e.stopPropagation();
                                props.onToggle(node.id);
                            }}
                            className={cn(
                                'flex size-5 shrink-0 items-center justify-center rounded border transition-colors',
                                isCollapsed
                                    ? 'border-brand/40 bg-brand/10 text-brand'
                                    : 'border-input bg-background text-muted-foreground hover:border-brand hover:text-brand',
                            )}
                        >
                            <ChevronRight
                                className={cn(
                                    'size-3.5 transition-transform',
                                    !isCollapsed && 'rotate-90',
                                )}
                            />
                        </span>
                    ) : (
                        <span
                            className="ml-1 size-1.5 shrink-0 rounded-full bg-muted-foreground/30"
                            aria-hidden
                        />
                    )}
                    <span className="truncate">{nodeLabel(node)}</span>
                    {hasChildren && (
                        <span className="ml-auto shrink-0 rounded bg-background px-1.5 text-[10px] font-medium text-muted-foreground tabular-nums">
                            {node.children?.length}
                        </span>
                    )}
                </button>
            )}
            {hasChildren &&
                !isCollapsed &&
                node.children?.map((child) => (
                    <LayerRow
                        {...props}
                        key={child.id}
                        node={child}
                        depth={depth + 1}
                    />
                ))}
        </>
    );
}

// --- Builder page ------------------------------------------------------------

export default function TemplateBuilder({ template, sampleInvitation }: Props) {
    // The builder edits two independent trees — the invitation body and the
    // cover ("Buka Undangan" screen) — switched by the `tab`. `tree`/`setTree`
    // always point at whichever one is active.
    const [tab, setTab] = useState<BuilderTab>('body');
    const [trees, setTrees] = useState<Record<BuilderTab, TemplateLayout>>({
        body: template.layout,
        cover: template.cover,
    });
    const tree = trees[tab];
    const setTree = (updater: (prev: TemplateLayout) => TemplateLayout) =>
        setTrees((prev) => ({ ...prev, [tab]: updater(prev[tab]) }));

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [device, setDevice] = useState<Device>('mobile');
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

    const switchTab = (next: BuilderTab) => {
        if (next !== tab) {
            setTab(next);
            setSelectedId(null);
        }
    };

    const toggleCollapsed = (id: string) =>
        setCollapsed((prev) => {
            const next = new Set(prev);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });

    // Every collapsible node except the root (kept open so its sections stay
    // visible as an outline when everything is collapsed).
    const parentIds = useMemo(() => {
        const collect = (node: TreeNode): string[] =>
            node.children?.length
                ? [node.id, ...node.children.flatMap(collect)]
                : [];

        return collect(tree.root).filter((id) => id !== tree.root.id);
    }, [tree.root]);

    const allCollapsed =
        parentIds.length > 0 && parentIds.every((id) => collapsed.has(id));

    const toggleCollapseAll = () =>
        setCollapsed(allCollapsed ? new Set() : new Set(parentIds));

    const theme = resolveTheme(template.category);
    const selected = selectedId ? findNode(tree.root, selectedId) : null;

    const setRoot = (root: TemplateLayout['root']) =>
        setTree((prev) => ({ ...prev, root }));

    const patchSelected = (patch: Partial<TreeNode>) => {
        if (!selectedId) {
            return;
        }

        setRoot(updateNode(tree.root, selectedId, patch));
    };

    // The style layer the inspector edits for the active device: the base `style`
    // on desktop, the `responsive.mobile` override on mobile (Elementor-style).
    const editingMobile = device === 'mobile';
    const activeStyle: StyleProps =
        (editingMobile ? selected?.responsive?.mobile : selected?.style) ?? {};

    /** Set/clear one style key on the active device layer (undefined removes it). */
    const patchStyleKey = <K extends keyof StyleProps>(
        key: K,
        value: StyleProps[K] | undefined,
    ) => {
        if (!selected) {
            return;
        }

        if (editingMobile) {
            const mobile: Partial<StyleProps> = {
                ...(selected.responsive?.mobile ?? {}),
            };

            if (value === undefined) {
                delete mobile[key];
            } else {
                mobile[key] = value;
            }

            patchSelected({
                responsive: {
                    ...selected.responsive,
                    mobile: Object.keys(mobile).length > 0 ? mobile : undefined,
                },
            } as Partial<TreeNode>);

            return;
        }

        const style: StyleProps = { ...(selected.style ?? {}) };

        if (value === undefined) {
            delete style[key];
        } else {
            style[key] = value;
        }

        patchSelected({ style } as Partial<TreeNode>);
    };

    // Container flow/columns are node props on desktop, but a mobile override
    // lives in `responsive.mobile` — so their effective value depends on device.
    const container = selected?.type === 'container' ? selected : null;
    const effectiveLayout =
        (editingMobile ? selected?.responsive?.mobile?.layout : undefined) ??
        container?.layout;
    const effectiveColumns =
        (editingMobile ? selected?.responsive?.mobile?.columns : undefined) ??
        container?.columns;

    /** Set/clear a container-layout key on the active device layer. */
    const patchContainerKey = <K extends 'layout' | 'columns'>(
        key: K,
        value: ResponsiveOverride[K] | undefined,
    ) => {
        if (!selected) {
            return;
        }

        if (editingMobile) {
            const mobile: ResponsiveOverride = {
                ...(selected.responsive?.mobile ?? {}),
            };

            if (value === undefined) {
                delete mobile[key];
            } else {
                mobile[key] = value;
            }

            patchSelected({
                responsive: {
                    ...selected.responsive,
                    mobile: Object.keys(mobile).length > 0 ? mobile : undefined,
                },
            } as Partial<TreeNode>);

            return;
        }

        patchSelected({ [key]: value } as Partial<TreeNode>);
    };

    const addNode = (type: NodeType, widget?: WidgetKind) => {
        const node = createNode(type, widget);
        const parentId =
            selected &&
            (selected.type === 'section' || selected.type === 'container')
                ? selected.id
                : tree.root.id;
        setRoot(insertNode(tree.root, parentId, node));
        setSelectedId(node.id);
    };

    const removeSelected = () => {
        if (!selectedId || selectedId === tree.root.id) {
            return;
        }

        setRoot(removeNode(tree.root, selectedId));
        setSelectedId(null);
    };

    const move = (direction: -1 | 1) => {
        if (!selectedId) {
            return;
        }

        setRoot(moveNode(tree.root, selectedId, direction));
    };

    // --- Layer-tree context menu (rename / copy / paste / delete) ------------
    const [contextMenu, setContextMenu] = useState<{
        id: string;
        x: number;
        y: number;
    } | null>(null);
    const [clipboard, setClipboard] = useState<TreeNode | null>(null);
    const [renamingId, setRenamingId] = useState<string | null>(null);

    const renameNode = (id: string, name: string) => {
        const trimmed = name.trim();

        setRoot(
            updateNode(tree.root, id, {
                name: trimmed || undefined,
            } as Partial<TreeNode>),
        );
        setRenamingId(null);
    };

    const copyNode = (id: string) => {
        const node = findNode(tree.root, id);

        if (node) {
            setClipboard(node);
        }
    };

    const pasteNode = (targetId: string) => {
        if (!clipboard) {
            return;
        }

        const clone = cloneWithNewIds(clipboard);
        const target = findNode(tree.root, targetId);

        // Paste inside a section/container; otherwise drop it after the target.
        if (
            target &&
            (target.type === 'section' || target.type === 'container')
        ) {
            setRoot(insertNode(tree.root, targetId, clone));
        } else {
            setRoot(insertRelative(tree.root, clone, targetId, 'after'));
        }

        setSelectedId(clone.id);
    };

    const deleteNode = (id: string) => {
        if (id === tree.root.id) {
            return;
        }

        setRoot(removeNode(tree.root, id));
        setSelectedId((prev) => (prev === id ? null : prev));
    };

    // --- Drag and drop (reorder existing nodes + drop new ones from palette) ---
    const [drag, setDrag] = useState<DragPayload | null>(null);
    const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

    const endDrag = () => {
        setDrag(null);
        setDropTarget(null);
    };

    const onRowDragOver = (node: TreeNode, position: DropPosition) => {
        if (!drag) {
            return;
        }

        // The root can only receive children (it has no siblings to sit beside).
        const pos: DropPosition =
            node.id === tree.root.id ? 'inside' : position;

        // A node can't be dropped onto itself or into its own subtree.
        if (drag.kind === 'move') {
            const dragged = findNode(tree.root, drag.id);

            if (
                node.id === drag.id ||
                (dragged && findNode(dragged, node.id))
            ) {
                setDropTarget(null);

                return;
            }
        }

        setDropTarget({ id: node.id, position: pos });
    };

    const onRowDrop = () => {
        if (!drag || !dropTarget) {
            endDrag();

            return;
        }

        if (drag.kind === 'move') {
            setRoot(
                moveRelative(
                    tree.root,
                    drag.id,
                    dropTarget.id,
                    dropTarget.position,
                ),
            );
            setSelectedId(drag.id);
        } else {
            const node = createNode(drag.type, drag.widget);
            setRoot(
                insertRelative(
                    tree.root,
                    node,
                    dropTarget.id,
                    dropTarget.position,
                ),
            );
            setSelectedId(node.id);
        }

        endDrag();
    };

    // --- Canvas interactions (click a rendered node to select; drop onto it) ---
    const nodeAtEvent = (
        e: React.MouseEvent | React.DragEvent,
    ): { node: TreeNode; el: HTMLElement } | null => {
        const el = (e.target as HTMLElement).closest<HTMLElement>(
            '[data-node-id]',
        );

        if (!el?.dataset.nodeId) {
            return null;
        }

        const node = findNode(tree.root, el.dataset.nodeId);

        return node ? { node, el } : null;
    };

    const onCanvasClick = (e: React.MouseEvent) => {
        // Cancel any link/button default so previewing never navigates away.
        e.preventDefault();
        const hit = nodeAtEvent(e);

        if (hit) {
            setSelectedId(hit.node.id);
        }
    };

    const onCanvasDragOver = (e: React.DragEvent) => {
        if (!drag) {
            return;
        }

        e.preventDefault();
        e.dataTransfer.dropEffect = drag.kind === 'move' ? 'move' : 'copy';
        const hit = nodeAtEvent(e);

        if (!hit) {
            return;
        }

        const rect = hit.el.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const canInside =
            hit.node.type === 'section' || hit.node.type === 'container';
        const position: DropPosition =
            canInside && y > rect.height * 0.33 && y < rect.height * 0.67
                ? 'inside'
                : y < rect.height / 2
                  ? 'before'
                  : 'after';
        onRowDragOver(hit.node, position);
    };

    // --- Asset upload (cover images / Lottie files) --------------------------
    const [uploading, setUploading] = useState(false);

    const uploadAsset = async (file: File): Promise<string | null> => {
        const form = new FormData();
        form.append('asset', file);
        setUploading(true);

        try {
            const xsrf = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
            const response = await fetch(
                admin.templates.assets.store(template.id).url,
                {
                    method: 'POST',
                    body: form,
                    credentials: 'same-origin',
                    headers: {
                        Accept: 'application/json',
                        'X-XSRF-TOKEN': xsrf ? decodeURIComponent(xsrf[1]) : '',
                    },
                },
            );

            if (!response.ok) {
                throw new Error('upload failed');
            }

            const data = (await response.json()) as { url: string };

            return data.url;
        } catch {
            toast.error('Gagal mengunggah aset. Coba lagi.');

            return null;
        } finally {
            setUploading(false);
        }
    };

    const save = () => {
        setSaving(true);
        router.put(
            admin.templates.update(template.id).url,
            {
                layout: trees.body,
                cover: trees.cover,
            } as unknown as Record<string, never>,
            {
                preserveScroll: true,
                onError: () =>
                    toast.error('Gagal menyimpan layout. Coba lagi.'),
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <>
            <Head title={`Builder — ${template.name}`} />
            <div className="flex h-[calc(100vh-4rem)] flex-col">
                {/* Top bar */}
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="icon">
                            <a href={admin.templates.index().url}>
                                <ArrowLeft className="size-4" />
                            </a>
                        </Button>
                        <h1 className="text-lg font-semibold">
                            {template.name}
                        </h1>
                        {/* Body / Cover tree switch. */}
                        <div className="ml-2 flex items-center gap-1 rounded-md border border-input bg-background p-0.5">
                            {[
                                {
                                    value: 'body' as const,
                                    icon: LayoutList,
                                    label: 'Undangan',
                                },
                                {
                                    value: 'cover' as const,
                                    icon: MailOpen,
                                    label: 'Cover',
                                },
                            ].map((t) => {
                                const active = tab === t.value;

                                return (
                                    <button
                                        key={t.value}
                                        type="button"
                                        title={t.label}
                                        aria-pressed={active}
                                        onClick={() => switchTab(t.value)}
                                        className={cn(
                                            'flex h-8 items-center gap-1.5 rounded px-3 text-xs font-medium transition-colors',
                                            active
                                                ? 'bg-brand/10 text-brand'
                                                : 'text-muted-foreground hover:bg-muted',
                                        )}
                                    >
                                        <t.icon className="size-4" />
                                        {t.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    {/* Device preview toggle (Elementor-style). */}
                    <div className="flex items-center gap-1 rounded-md border border-input bg-background p-0.5">
                        {[
                            {
                                value: 'desktop' as const,
                                icon: Monitor,
                                label: 'Desktop',
                            },
                            {
                                value: 'mobile' as const,
                                icon: Smartphone,
                                label: 'Mobile',
                            },
                        ].map((d) => {
                            const active = device === d.value;

                            return (
                                <button
                                    key={d.value}
                                    type="button"
                                    title={d.label}
                                    aria-label={d.label}
                                    aria-pressed={active}
                                    onClick={() => setDevice(d.value)}
                                    className={cn(
                                        'flex h-8 items-center gap-1.5 rounded px-3 text-xs font-medium transition-colors',
                                        active
                                            ? 'bg-brand/10 text-brand'
                                            : 'text-muted-foreground hover:bg-muted',
                                    )}
                                >
                                    <d.icon className="size-4" />
                                    <span className="hidden sm:inline">
                                        {d.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline">
                            <a
                                href={admin.templates.preview(template.id).url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Pratinjau versi tersimpan di tab baru"
                            >
                                <ExternalLink className="size-4" /> Preview
                            </a>
                        </Button>
                        <Button onClick={save} disabled={saving}>
                            <Save className="size-4" />{' '}
                            {saving ? 'Menyimpan…' : 'Simpan Layout'}
                        </Button>
                    </div>
                </div>

                <div className="grid flex-1 grid-cols-[260px_1fr_300px] overflow-hidden">
                    {/* Left: palette + layer tree */}
                    <div className="flex flex-col gap-4 overflow-auto border-r p-3">
                        <div>
                            <h2 className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
                                Tambah Elemen
                            </h2>
                            <div className="grid grid-cols-2 gap-1.5">
                                {(tab === 'cover'
                                    ? [...ELEMENTS, ...COVER_ELEMENTS]
                                    : ELEMENTS
                                ).map((el) => (
                                    <PaletteCard
                                        key={el.type}
                                        label={el.label}
                                        icon={el.icon}
                                        dragData={el.type}
                                        payload={{ kind: 'new', type: el.type }}
                                        onSetDrag={setDrag}
                                        onEndDrag={endDrag}
                                        onAdd={() => addNode(el.type)}
                                    />
                                ))}
                            </div>
                            <h3 className="mt-4 mb-1.5 text-[11px] font-semibold text-muted-foreground uppercase">
                                Widget
                            </h3>
                            <div className="grid grid-cols-2 gap-1.5">
                                {WIDGET_KINDS.map((w) => (
                                    <PaletteCard
                                        key={w}
                                        label={WIDGET_REGISTRY[w].label}
                                        icon={WIDGET_ICONS[w]}
                                        dragData={w}
                                        payload={{
                                            kind: 'new',
                                            type: 'widget',
                                            widget: w,
                                        }}
                                        onSetDrag={setDrag}
                                        onEndDrag={endDrag}
                                        onAdd={() => addNode('widget', w)}
                                    />
                                ))}
                            </div>
                            <p className="mt-2 text-[11px] text-muted-foreground">
                                Klik untuk menambah, atau seret ke panel
                                Struktur untuk menaruh di posisi tertentu.
                            </p>
                        </div>

                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <h2 className="text-xs font-semibold text-muted-foreground uppercase">
                                    Struktur
                                </h2>
                                <button
                                    type="button"
                                    onClick={toggleCollapseAll}
                                    title={
                                        allCollapsed
                                            ? 'Buka semua'
                                            : 'Tutup semua'
                                    }
                                    aria-label={
                                        allCollapsed
                                            ? 'Buka semua'
                                            : 'Tutup semua'
                                    }
                                    className="flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-brand hover:text-brand"
                                >
                                    {allCollapsed ? (
                                        <ChevronsUpDown className="size-3.5" />
                                    ) : (
                                        <ChevronsDownUp className="size-3.5" />
                                    )}
                                    {allCollapsed
                                        ? 'Buka semua'
                                        : 'Tutup semua'}
                                </button>
                            </div>
                            <p className="mb-1 text-[11px] text-muted-foreground">
                                Seret baris untuk menyusun ulang.
                            </p>
                            <div className="rounded-md border">
                                <LayerRow
                                    node={tree.root}
                                    depth={0}
                                    selectedId={selectedId}
                                    onSelect={setSelectedId}
                                    dropTarget={dropTarget}
                                    collapsed={collapsed}
                                    onToggle={toggleCollapsed}
                                    onRowDragStart={(id) =>
                                        setDrag({ kind: 'move', id })
                                    }
                                    onRowDragOver={onRowDragOver}
                                    onRowDrop={onRowDrop}
                                    onDragEnd={endDrag}
                                    onContextMenu={(n, x, y) =>
                                        setContextMenu({ id: n.id, x, y })
                                    }
                                    renamingId={renamingId}
                                    onRenameCommit={renameNode}
                                    onRenameCancel={() => setRenamingId(null)}
                                />
                            </div>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                                Klik kanan sebuah baris untuk ganti nama, salin,
                                tempel, atau hapus.
                            </p>
                        </div>
                    </div>

                    {/* Center: live preview (click a block to select, drop onto it) */}
                    <div className="overflow-auto bg-muted/40 p-4">
                        <div
                            className={cn(
                                'invitation-scope mx-auto w-full overflow-hidden rounded-xl border shadow-sm transition-[max-width] duration-300',
                                theme.page,
                                theme.text,
                            )}
                            style={{
                                ...theme.vars,
                                maxWidth: DEVICE_WIDTH[device],
                            }}
                            onClick={onCanvasClick}
                            onDragOver={onCanvasDragOver}
                            onDrop={(e) => {
                                e.preventDefault();
                                onRowDrop();
                            }}
                        >
                            <TemplateRenderer
                                layout={tree}
                                ctx={{
                                    invitation: sampleInvitation,
                                    guestName: 'Rahmat',
                                    hydrated: true,
                                    device,
                                    preview: true,
                                    editor: true,
                                    selectedId,
                                    dropTargetId: dropTarget?.id ?? null,
                                    dropPosition: dropTarget?.position,
                                }}
                            />
                        </div>
                    </div>

                    {/* Right: inspector */}
                    <div className="overflow-auto border-l p-3">
                        {selected === null ? (
                            <p className="text-sm text-muted-foreground">
                                Pilih elemen di panel Struktur untuk mengatur
                                properti.
                            </p>
                        ) : (
                            <div className="grid gap-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold">
                                        {nodeLabel(selected)}
                                    </span>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => move(-1)}
                                        >
                                            <ChevronUp className="size-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => move(1)}
                                        >
                                            <ChevronDown className="size-4" />
                                        </Button>
                                        {selected.id !== tree.root.id && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive"
                                                onClick={removeSelected}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Type-specific */}
                                {selected.type === 'text' && (
                                    <>
                                        <Field label="Tag">
                                            <OptionGroup
                                                value={selected.tag}
                                                onChange={(tag) =>
                                                    patchSelected({
                                                        tag,
                                                    } as Partial<TreeNode>)
                                                }
                                                options={opt([
                                                    'eyebrow',
                                                    'h1',
                                                    'h2',
                                                    'h3',
                                                    'p',
                                                ])}
                                            />
                                        </Field>
                                        <Field label="Konten">
                                            <ValueEditor
                                                value={selected.value}
                                                onChange={(value) =>
                                                    patchSelected({
                                                        value,
                                                    } as Partial<TreeNode>)
                                                }
                                            />
                                        </Field>
                                    </>
                                )}

                                {selected.type === 'section' && (
                                    <Field label="Varian">
                                        <OptionGroup
                                            value={
                                                selected.variant ?? 'default'
                                            }
                                            onChange={(variant) =>
                                                patchSelected({
                                                    variant,
                                                } as Partial<TreeNode>)
                                            }
                                            options={opt([
                                                'hero',
                                                'default',
                                                'footer',
                                            ])}
                                        />
                                    </Field>
                                )}

                                {selected.type === 'container' && (
                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-semibold text-muted-foreground uppercase">
                                                Tata Letak
                                            </Label>
                                            <DeviceBadge device={device} />
                                        </div>
                                        {editingMobile && (
                                            <p className="text-[11px] text-muted-foreground">
                                                Tata letak khusus Mobile. Klik
                                                pilihan aktif untuk ikut
                                                Desktop.
                                            </p>
                                        )}
                                        <Field label="Aliran">
                                            <OptionGroup
                                                allowClear={editingMobile}
                                                value={
                                                    effectiveLayout ?? 'stack'
                                                }
                                                onChange={(l) =>
                                                    patchContainerKey(
                                                        'layout',
                                                        (l === ''
                                                            ? undefined
                                                            : l) as
                                                            | 'stack'
                                                            | 'row'
                                                            | 'grid'
                                                            | undefined,
                                                    )
                                                }
                                                options={[
                                                    {
                                                        value: 'stack',
                                                        title: 'Tumpuk',
                                                        icon: Rows3,
                                                    },
                                                    {
                                                        value: 'row',
                                                        title: 'Baris',
                                                        icon: Columns3,
                                                    },
                                                    {
                                                        value: 'grid',
                                                        title: 'Grid',
                                                        icon: Grid2x2,
                                                    },
                                                ]}
                                            />
                                        </Field>
                                        {effectiveLayout === 'grid' && (
                                            <Field label="Kolom">
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={4}
                                                    value={
                                                        effectiveColumns ?? 2
                                                    }
                                                    onChange={(e) =>
                                                        patchContainerKey(
                                                            'columns',
                                                            e.target.value ===
                                                                ''
                                                                ? undefined
                                                                : Number(
                                                                      e.target
                                                                          .value,
                                                                  ),
                                                        )
                                                    }
                                                />
                                            </Field>
                                        )}
                                    </div>
                                )}

                                {selected.type === 'widget' && (
                                    <div className="grid gap-2">
                                        <Label className="text-xs text-muted-foreground">
                                            Binding
                                        </Label>
                                        {Object.entries(selected.bindings).map(
                                            ([key, val]) => (
                                                <Field key={key} label={key}>
                                                    <ValueEditor
                                                        value={val}
                                                        onChange={(v) =>
                                                            patchSelected({
                                                                bindings: {
                                                                    ...selected.bindings,
                                                                    [key]: v,
                                                                },
                                                            } as Partial<TreeNode>)
                                                        }
                                                    />
                                                </Field>
                                            ),
                                        )}
                                    </div>
                                )}

                                {selected.type === 'image' && (
                                    <Field label="Sumber">
                                        <AssetInput
                                            value={selected.src}
                                            accept="image/*"
                                            uploading={uploading}
                                            onUpload={uploadAsset}
                                            onChange={(src) =>
                                                patchSelected({
                                                    src,
                                                } as Partial<TreeNode>)
                                            }
                                        />
                                    </Field>
                                )}

                                {selected.type === 'button' && (
                                    <>
                                        <Field label="Teks Tombol">
                                            <ValueEditor
                                                value={selected.label}
                                                onChange={(label) =>
                                                    patchSelected({
                                                        label,
                                                    } as Partial<TreeNode>)
                                                }
                                            />
                                        </Field>
                                        <Field label="Aksi">
                                            <OptionGroup
                                                value={
                                                    selected.action ?? 'open'
                                                }
                                                onChange={(action) =>
                                                    patchSelected({
                                                        action,
                                                    } as Partial<TreeNode>)
                                                }
                                                options={[
                                                    {
                                                        value: 'open',
                                                        label: 'Buka undangan',
                                                    },
                                                    {
                                                        value: 'none',
                                                        label: 'Tidak ada',
                                                    },
                                                ]}
                                            />
                                        </Field>
                                    </>
                                )}

                                {selected.type === 'lottie' && (
                                    <>
                                        <Field label="Sumber (.json/.lottie)">
                                            <AssetInput
                                                value={selected.src}
                                                accept=".json,.lottie,application/json"
                                                uploading={uploading}
                                                onUpload={uploadAsset}
                                                onChange={(src) =>
                                                    patchSelected({
                                                        src,
                                                    } as Partial<TreeNode>)
                                                }
                                            />
                                        </Field>
                                        <Field label="Ulang (loop)">
                                            <OptionGroup
                                                value={
                                                    (selected.loop ?? true)
                                                        ? 'yes'
                                                        : 'no'
                                                }
                                                onChange={(v) =>
                                                    patchSelected({
                                                        loop: v === 'yes',
                                                    } as Partial<TreeNode>)
                                                }
                                                options={[
                                                    {
                                                        value: 'yes',
                                                        label: 'Ya',
                                                    },
                                                    {
                                                        value: 'no',
                                                        label: 'Tidak',
                                                    },
                                                ]}
                                            />
                                        </Field>
                                        <Field label="Kecepatan">
                                            <Input
                                                type="number"
                                                min={0.1}
                                                max={4}
                                                step={0.1}
                                                value={selected.speed ?? 1}
                                                onChange={(e) =>
                                                    patchSelected({
                                                        speed: Number(
                                                            e.target.value,
                                                        ),
                                                    } as Partial<TreeNode>)
                                                }
                                            />
                                        </Field>
                                    </>
                                )}

                                {selected.type === 'spacer' && (
                                    <Field label="Ukuran">
                                        <OptionGroup
                                            value={selected.size}
                                            onChange={(size) =>
                                                patchSelected({
                                                    size,
                                                } as Partial<TreeNode>)
                                            }
                                            options={opt([
                                                'xs',
                                                'sm',
                                                'md',
                                                'lg',
                                                'xl',
                                                '2xl',
                                            ])}
                                        />
                                    </Field>
                                )}

                                {/* Style — edits the base (Desktop) or the Mobile
                                    override, depending on the device toggle. */}
                                <div className="border-t pt-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold text-muted-foreground uppercase">
                                            Gaya
                                        </Label>
                                        <DeviceBadge device={device} />
                                    </div>
                                    {editingMobile && (
                                        <p className="mt-1 text-[11px] text-muted-foreground">
                                            Menyunting gaya khusus Mobile.
                                            Kosong = ikut Desktop.
                                        </p>
                                    )}
                                    <div className="mt-2 grid gap-2">
                                        {STYLE_TOKENS.map((token) => (
                                            <Field
                                                key={token.key}
                                                label={token.label}
                                            >
                                                <OptionGroup
                                                    allowClear
                                                    value={
                                                        (activeStyle[
                                                            token.key
                                                        ] as string) ?? ''
                                                    }
                                                    onChange={(v) =>
                                                        patchStyleKey(
                                                            token.key,
                                                            (v === ''
                                                                ? undefined
                                                                : v) as never,
                                                        )
                                                    }
                                                    options={token.values.map(
                                                        (v) => ({
                                                            value: v,
                                                            label: v,
                                                            icon: token.icons?.[
                                                                v
                                                            ],
                                                        }),
                                                    )}
                                                />
                                            </Field>
                                        ))}
                                        <Field label="Gerak (motion)">
                                            <OptionGroup
                                                allowClear
                                                value={activeStyle.motion ?? ''}
                                                onChange={(v) =>
                                                    patchStyleKey(
                                                        'motion',
                                                        (v === ''
                                                            ? undefined
                                                            : v) as never,
                                                    )
                                                }
                                                options={MOTION_OPTIONS}
                                            />
                                        </Field>
                                        <Field label="Padding (px)">
                                            <SidesInput
                                                value={activeStyle.paddingPx}
                                                onChange={(paddingPx) =>
                                                    patchStyleKey(
                                                        'paddingPx',
                                                        paddingPx,
                                                    )
                                                }
                                            />
                                        </Field>
                                        <Field label="Margin (px)">
                                            <SidesInput
                                                value={activeStyle.marginPx}
                                                onChange={(marginPx) =>
                                                    patchStyleKey(
                                                        'marginPx',
                                                        marginPx,
                                                    )
                                                }
                                            />
                                        </Field>
                                    </div>
                                </div>

                                {/* Visibility */}
                                <div className="border-t pt-3">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase">
                                        Kondisi Tampil
                                    </Label>
                                    <div className="mt-2">
                                        <VisibilityEditor
                                            value={selected.visibleWhen}
                                            onChange={(v) =>
                                                patchSelected({
                                                    visibleWhen: v,
                                                } as Partial<TreeNode>)
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Animation */}
                                <div className="border-t pt-3">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase">
                                        Animasi
                                    </Label>
                                    <div className="mt-2 grid gap-2">
                                        <Field label="Reveal saat discroll">
                                            <OptionGroup
                                                allowClear
                                                value={
                                                    selected.animationRef
                                                        ?.reveal ?? ''
                                                }
                                                onChange={(r) =>
                                                    patchSelected({
                                                        animationRef: {
                                                            ...selected.animationRef,
                                                            reveal:
                                                                r === ''
                                                                    ? null
                                                                    : (r as never),
                                                        },
                                                    } as Partial<TreeNode>)
                                                }
                                                options={REVEAL_OPTIONS.map(
                                                    (v) => ({
                                                        value: v,
                                                        label: v.replace(
                                                            '_',
                                                            ' ',
                                                        ),
                                                    }),
                                                )}
                                            />
                                        </Field>
                                        {selected.type === 'section' && (
                                            <Field label="Region pack melayang">
                                                <OptionGroup
                                                    allowClear
                                                    value={
                                                        selected.animationRef
                                                            ?.packSection ?? ''
                                                    }
                                                    onChange={(s) =>
                                                        patchSelected({
                                                            animationRef: {
                                                                ...selected.animationRef,
                                                                packSection:
                                                                    s === ''
                                                                        ? null
                                                                        : (s as never),
                                                            },
                                                        } as Partial<TreeNode>)
                                                    }
                                                    options={opt(PACK_SECTIONS)}
                                                />
                                            </Field>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {contextMenu &&
                (() => {
                    const node = findNode(tree.root, contextMenu.id);

                    if (!node) {
                        return null;
                    }

                    return (
                        <ContextMenu
                            x={contextMenu.x}
                            y={contextMenu.y}
                            onClose={() => setContextMenu(null)}
                            items={[
                                {
                                    label: 'Ganti Nama',
                                    icon: Pencil,
                                    onClick: () => setRenamingId(node.id),
                                },
                                {
                                    label: 'Salin',
                                    icon: Copy,
                                    onClick: () => copyNode(node.id),
                                },
                                {
                                    label: 'Tempel',
                                    icon: ClipboardPaste,
                                    onClick: () => pasteNode(node.id),
                                    disabled: !clipboard,
                                },
                                {
                                    label: 'Hapus',
                                    icon: Trash2,
                                    onClick: () => deleteNode(node.id),
                                    disabled: node.id === tree.root.id,
                                    danger: true,
                                },
                            ]}
                        />
                    );
                })()}
        </>
    );
}

TemplateBuilder.layout = () => ({
    breadcrumbs: [
        { title: 'Admin', href: admin.dashboard().url },
        { title: 'Templates', href: admin.templates.index().url },
    ],
});
