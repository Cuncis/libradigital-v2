/**
 * Template Builder - immutable node-tree operations used by the admin builder.
 * Every mutator returns a new root so React re-renders on change.
 */
import type {
    NodeType,
    SectionNode,
    TreeNode,
    Value,
    WidgetKind,
} from './nodes';
import { WIDGET_REGISTRY } from './widgets';

type Root = SectionNode | TreeNode;

export function genId(): string {
    return `n_${Math.random().toString(36).slice(2, 10)}`;
}

/** Deep-clone a node/subtree, assigning fresh ids so it can be pasted safely. */
export function cloneWithNewIds(node: TreeNode): TreeNode {
    const clone = structuredClone(node);

    const reassign = (n: TreeNode): void => {
        n.id = genId();
        n.children?.forEach(reassign);
    };

    reassign(clone);

    return clone;
}

/** Short human label for a node in the layer tree. */
export function nodeLabel(node: TreeNode): string {
    if (node.name) {
        return node.name;
    }

    switch (node.type) {
        case 'section':
            return `Section (${node.variant ?? 'default'})`;
        case 'container':
            return `Container (${node.layout})`;
        case 'text':
            return `Text: ${previewText(node.value)}`;
        case 'image':
            return 'Image';
        case 'widget':
            return WIDGET_REGISTRY[node.widget]?.label ?? node.widget;
        case 'spacer':
            return 'Spacer';
        case 'divider':
            return 'Divider';
        case 'button':
            return `Tombol: ${previewText(node.label)}`;
        case 'lottie':
            return 'Lottie';
    }
}

function previewText(value: Value): string {
    switch (value.kind) {
        case 'literal':
            return value.value.slice(0, 24) || '(kosong)';
        case 'bind':
            return `{${value.field}}`;
        case 'template':
            return value.parts.map(previewText).join('');
    }
}

export function findNode(root: Root, id: string): TreeNode | null {
    if (root.id === id) {
        return root;
    }

    for (const child of root.children ?? []) {
        const found = findNode(child, id);

        if (found) {
            return found;
        }
    }

    return null;
}

/** Return a new tree with the matching node shallow-merged with `patch`. */
export function updateNode<T extends Root>(
    root: T,
    id: string,
    patch: Partial<TreeNode>,
): T {
    if (root.id === id) {
        return { ...root, ...patch } as T;
    }

    if (!root.children) {
        return root;
    }

    return {
        ...root,
        children: root.children.map((child) => updateNode(child, id, patch)),
    };
}

/** Return a new tree with the matching node removed (root itself is never removed). */
export function removeNode<T extends Root>(root: T, id: string): T {
    if (!root.children) {
        return root;
    }

    return {
        ...root,
        children: root.children
            .filter((child) => child.id !== id)
            .map((child) => removeNode(child, id)),
    };
}

/** Insert `node` as a child of `parentId` at `index` (appended when omitted). */
export function insertNode<T extends Root>(
    root: T,
    parentId: string,
    node: TreeNode,
    index?: number,
): T {
    if (root.id === parentId && root.children) {
        const children = [...root.children];
        children.splice(index ?? children.length, 0, node);

        return { ...root, children };
    }

    if (!root.children) {
        return root;
    }

    return {
        ...root,
        children: root.children.map((child) =>
            insertNode(child, parentId, node, index),
        ),
    };
}

/** Move a node up or down within its parent's child list. */
export function moveNode<T extends Root>(
    root: T,
    id: string,
    direction: -1 | 1,
): T {
    if (root.children) {
        const idx = root.children.findIndex((child) => child.id === id);

        if (idx !== -1) {
            const target = idx + direction;

            if (target < 0 || target >= root.children.length) {
                return root;
            }

            const children = [...root.children];
            [children[idx], children[target]] = [
                children[target],
                children[idx],
            ];

            return { ...root, children };
        }
    }

    if (!root.children) {
        return root;
    }

    return {
        ...root,
        children: root.children.map((child) => moveNode(child, id, direction)),
    };
}

function defaultBinding(key: string): Value {
    switch (key) {
        case 'slug':
            return { kind: 'bind', field: 'ctx.slug' };
        case 'target':
            return { kind: 'bind', field: 'wedding_date' };
        case 'story':
            return { kind: 'bind', field: 'love_story' };
        case 'variant':
            return { kind: 'literal', value: 'card' };
        case 'title':
            return { kind: 'literal', value: 'Judul' };
        default:
            return { kind: 'literal', value: '' };
    }
}

/** Create a fresh node of the given type with sensible defaults. */
export function createNode(type: NodeType, widget?: WidgetKind): TreeNode {
    const id = genId();

    switch (type) {
        case 'section':
            return {
                id,
                type: 'section',
                variant: 'default',
                style: {},
                children: [],
            };
        case 'container':
            return {
                id,
                type: 'container',
                layout: 'stack',
                gap: 'md',
                style: {},
                children: [],
            };
        case 'text':
            return {
                id,
                type: 'text',
                tag: 'p',
                style: {},
                value: { kind: 'literal', value: 'Teks baru' },
            };
        case 'image':
            return {
                id,
                type: 'image',
                fit: 'cover',
                style: {},
                src: { kind: 'bind', field: 'cover_photo' },
            };
        case 'spacer':
            return { id, type: 'spacer', size: 'md', style: {} };
        case 'divider':
            return { id, type: 'divider', style: {} };
        case 'button':
            return {
                id,
                type: 'button',
                action: 'open',
                style: {},
                label: { kind: 'literal', value: 'Buka Undangan' },
            };
        case 'lottie':
            return {
                id,
                type: 'lottie',
                loop: true,
                speed: 1,
                style: {},
                src: { kind: 'literal', value: '' },
            };
        case 'widget': {
            const kind = widget ?? 'countdown';
            const bindings: Record<string, Value> = {};

            for (const key of Object.keys(
                WIDGET_REGISTRY[kind].bindingSchema,
            )) {
                bindings[key] = defaultBinding(key);
            }

            return { id, type: 'widget', widget: kind, style: {}, bindings };
        }
    }
}

export type DropPosition = 'before' | 'after' | 'inside';

/**
 * Insert `node` relative to `targetId`: as a sibling before/after it, or as the
 * last child when `inside`.
 */
export function insertRelative<T extends Root>(
    root: T,
    node: TreeNode,
    targetId: string,
    position: DropPosition,
): T {
    if (position === 'inside') {
        return insertNode(root, targetId, node);
    }

    if (root.children) {
        const idx = root.children.findIndex((child) => child.id === targetId);

        if (idx !== -1) {
            const children = [...root.children];
            children.splice(position === 'before' ? idx : idx + 1, 0, node);

            return { ...root, children };
        }

        return {
            ...root,
            children: root.children.map((child) =>
                insertRelative(child, node, targetId, position),
            ),
        };
    }

    return root;
}

/**
 * Move an existing node next to / into a target. No-op for invalid moves
 * (onto itself, or into its own subtree - which would corrupt the tree).
 */
export function moveRelative<T extends Root>(
    root: T,
    dragId: string,
    targetId: string,
    position: DropPosition,
): T {
    if (dragId === targetId) {
        return root;
    }

    const dragged = findNode(root, dragId);

    if (!dragged || findNode(dragged, targetId)) {
        return root;
    }

    return insertRelative(
        removeNode(root, dragId),
        dragged,
        targetId,
        position,
    );
}
