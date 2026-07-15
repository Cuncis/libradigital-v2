import { Head, router } from '@inertiajs/react';
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    ArrowLeft,
    ChevronDown,
    ChevronRight,
    ChevronsDownUp,
    ChevronsUpDown,
    ChevronUp,
    Columns3,
    Grid2x2,
    Rows3,
    Save,
    Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import TemplateRenderer from '@/components/invitation/TemplateRenderer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BINDABLE_FIELDS } from '@/lib/template/bindableFields';
import type { BindableField } from '@/lib/template/bindableFields';
import type {
    NodeType,
    SpacingSides,
    StyleProps,
    TemplateLayout,
    TreeNode,
    Value,
    Visibility,
    WidgetKind,
} from '@/lib/template/nodes';
import {
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
    template: InvitationTemplate & { layout: TemplateLayout };
    sampleInvitation: PublicInvitation;
}

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
}

function LayerRow(props: LayerRowProps) {
    const { node, depth, selectedId, onSelect, dropTarget, collapsed } = props;
    const isRoot = depth === 0;
    const canInside = node.type === 'section' || node.type === 'container';
    const indicator = dropTarget?.id === node.id ? dropTarget.position : null;
    const hasChildren = (node.children?.length ?? 0) > 0;
    const isCollapsed = collapsed.has(node.id);

    return (
        <>
            <button
                type="button"
                draggable={!isRoot}
                onClick={() => onSelect(node.id)}
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
    const [layout, setLayout] = useState<TemplateLayout>(template.layout);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

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

        return collect(layout.root).filter((id) => id !== layout.root.id);
    }, [layout.root]);

    const allCollapsed =
        parentIds.length > 0 && parentIds.every((id) => collapsed.has(id));

    const toggleCollapseAll = () =>
        setCollapsed(allCollapsed ? new Set() : new Set(parentIds));

    const theme = resolveTheme(template.category);
    const selected = selectedId ? findNode(layout.root, selectedId) : null;

    const setRoot = (root: TemplateLayout['root']) =>
        setLayout((prev) => ({ ...prev, root }));

    const patchSelected = (patch: Partial<TreeNode>) => {
        if (!selectedId) {
            return;
        }

        setRoot(updateNode(layout.root, selectedId, patch));
    };

    const addNode = (type: NodeType, widget?: WidgetKind) => {
        const node = createNode(type, widget);
        const parentId =
            selected &&
            (selected.type === 'section' || selected.type === 'container')
                ? selected.id
                : layout.root.id;
        setRoot(insertNode(layout.root, parentId, node));
        setSelectedId(node.id);
    };

    const removeSelected = () => {
        if (!selectedId || selectedId === layout.root.id) {
            return;
        }

        setRoot(removeNode(layout.root, selectedId));
        setSelectedId(null);
    };

    const move = (direction: -1 | 1) => {
        if (!selectedId) {
            return;
        }

        setRoot(moveNode(layout.root, selectedId, direction));
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
            node.id === layout.root.id ? 'inside' : position;

        // A node can't be dropped onto itself or into its own subtree.
        if (drag.kind === 'move') {
            const dragged = findNode(layout.root, drag.id);

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
                    layout.root,
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
                    layout.root,
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

        const node = findNode(layout.root, el.dataset.nodeId);

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

    const save = () => {
        setSaving(true);
        router.put(
            admin.templates.update(template.id).url,
            { layout } as unknown as Record<string, never>,
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
                    </div>
                    <Button onClick={save} disabled={saving}>
                        <Save className="size-4" />{' '}
                        {saving ? 'Menyimpan…' : 'Simpan Layout'}
                    </Button>
                </div>

                <div className="grid flex-1 grid-cols-[260px_1fr_300px] overflow-hidden">
                    {/* Left: palette + layer tree */}
                    <div className="flex flex-col gap-4 overflow-auto border-r p-3">
                        <div>
                            <h2 className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
                                Tambah Elemen
                            </h2>
                            <div className="grid grid-cols-2 gap-1.5">
                                {(
                                    [
                                        'section',
                                        'container',
                                        'text',
                                        'image',
                                        'spacer',
                                        'divider',
                                    ] as NodeType[]
                                ).map((t) => (
                                    <Button
                                        key={t}
                                        variant="outline"
                                        size="sm"
                                        className="cursor-grab capitalize"
                                        draggable
                                        onDragStart={(e) => {
                                            // Required for the drag to start in
                                            // Firefox. Must be 'copyMove' (not
                                            // 'copy'): the layer-tree rows set
                                            // dropEffect 'move', and a dropEffect
                                            // not permitted by effectAllowed makes
                                            // the target invalid so `drop` never
                                            // fires — which broke drag-to-add.
                                            e.dataTransfer.setData(
                                                'text/plain',
                                                t,
                                            );
                                            e.dataTransfer.effectAllowed =
                                                'copyMove';
                                            setDrag({ kind: 'new', type: t });
                                        }}
                                        onDragEnd={endDrag}
                                        onClick={() => addNode(t)}
                                    >
                                        {t}
                                    </Button>
                                ))}
                            </div>
                            <div className="mt-2">
                                <Select
                                    value=""
                                    onChange={(w) =>
                                        w && addNode('widget', w as WidgetKind)
                                    }
                                    options={[
                                        {
                                            value: '',
                                            label: '+ Tambah Widget…',
                                        },
                                        ...WIDGET_KINDS.map((w) => ({
                                            value: w,
                                            label: WIDGET_REGISTRY[w].label,
                                        })),
                                    ]}
                                />
                            </div>
                            <p className="mt-1 text-[11px] text-muted-foreground">
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
                                    node={layout.root}
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
                                />
                            </div>
                        </div>
                    </div>

                    {/* Center: live preview (click a block to select, drop onto it) */}
                    <div className="overflow-auto bg-muted/40 p-4">
                        <div
                            className={cn(
                                'invitation-scope mx-auto max-w-md overflow-hidden rounded-xl border shadow-sm',
                                theme.page,
                                theme.text,
                            )}
                            style={theme.vars}
                            onClick={onCanvasClick}
                            onDragOver={onCanvasDragOver}
                            onDrop={(e) => {
                                e.preventDefault();
                                onRowDrop();
                            }}
                        >
                            <TemplateRenderer
                                layout={layout}
                                ctx={{
                                    invitation: sampleInvitation,
                                    guestName: 'Rahmat',
                                    hydrated: true,
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
                                        {selected.id !== layout.root.id && (
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
                                    <>
                                        <Field label="Tata Letak">
                                            <OptionGroup
                                                value={selected.layout}
                                                onChange={(l) =>
                                                    patchSelected({
                                                        layout: l,
                                                    } as Partial<TreeNode>)
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
                                        {selected.layout === 'grid' && (
                                            <Field label="Kolom">
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    max={4}
                                                    value={
                                                        selected.columns ?? 2
                                                    }
                                                    onChange={(e) =>
                                                        patchSelected({
                                                            columns: Number(
                                                                e.target.value,
                                                            ),
                                                        } as Partial<TreeNode>)
                                                    }
                                                />
                                            </Field>
                                        )}
                                    </>
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
                                        <ValueEditor
                                            value={selected.src}
                                            onChange={(src) =>
                                                patchSelected({
                                                    src,
                                                } as Partial<TreeNode>)
                                            }
                                        />
                                    </Field>
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

                                {/* Style */}
                                <div className="border-t pt-3">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase">
                                        Gaya
                                    </Label>
                                    <div className="mt-2 grid gap-2">
                                        {STYLE_TOKENS.map((token) => (
                                            <Field
                                                key={token.key}
                                                label={token.label}
                                            >
                                                <OptionGroup
                                                    allowClear
                                                    value={
                                                        ((selected.style ?? {})[
                                                            token.key
                                                        ] as string) ?? ''
                                                    }
                                                    onChange={(v) =>
                                                        patchSelected({
                                                            style: {
                                                                ...(selected.style ??
                                                                    {}),
                                                                [token.key]:
                                                                    v === ''
                                                                        ? undefined
                                                                        : v,
                                                            },
                                                        } as Partial<TreeNode>)
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
                                        <Field label="Padding (px)">
                                            <SidesInput
                                                value={
                                                    (selected.style ?? {})
                                                        .paddingPx
                                                }
                                                onChange={(paddingPx) =>
                                                    patchSelected({
                                                        style: {
                                                            ...(selected.style ??
                                                                {}),
                                                            paddingPx,
                                                        },
                                                    } as Partial<TreeNode>)
                                                }
                                            />
                                        </Field>
                                        <Field label="Margin (px)">
                                            <SidesInput
                                                value={
                                                    (selected.style ?? {})
                                                        .marginPx
                                                }
                                                onChange={(marginPx) =>
                                                    patchSelected({
                                                        style: {
                                                            ...(selected.style ??
                                                                {}),
                                                            marginPx,
                                                        },
                                                    } as Partial<TreeNode>)
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
        </>
    );
}

TemplateBuilder.layout = () => ({
    breadcrumbs: [
        { title: 'Admin', href: admin.dashboard().url },
        { title: 'Templates', href: admin.templates.index().url },
    ],
});
