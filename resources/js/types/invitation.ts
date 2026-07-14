import type { TemplateLayout } from '@/lib/template/nodes';

export type Timezone = 'WIB' | 'WITA' | 'WIT';
export type Attendance = 'hadir' | 'tidak_hadir' | 'ragu';
export type GiftType = 'bank' | 'ewallet';
export type InvitationStatus =
    'draft' | 'pending_payment' | 'active' | 'expired';
export type PackageTier = 'starter' | 'standard' | 'premium' | 'signature';
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type AnimationSection =
    'cover' | 'header' | 'countdown' | 'love_story' | 'rsvp' | 'gift';

export type AnimationEffect =
    | 'curtain_split'
    | 'doors'
    | 'cover_slide_up'
    | 'cover_zoom'
    | 'cover_fade'
    | 'fade'
    | 'slide_up'
    | 'slide_left'
    | 'slide_right'
    | 'zoom';

export interface Animation {
    id: number;
    name: string;
    section: AnimationSection;
    section_label: string;
    effect: AnimationEffect;
    effect_label: string;
    min_package: PackageTier | null;
    min_package_label: string | null;
    asset_url: string | null;
    is_active: boolean;
    sort_order: number;
}

export interface AnimationSectionOption {
    value: AnimationSection;
    label: string;
    is_cover: boolean;
}

export interface AnimationEffectOption {
    value: AnimationEffect;
    label: string;
    requires_asset: boolean;
    is_cover: boolean;
}

/** Map of the couple's chosen animation per section (absent = default). */
export type InvitationAnimations = Partial<Record<AnimationSection, Animation>>;

// --- Animation packs (floating GSAP overlays) ---

export type MotionType =
    | 'float-y'
    | 'float-x'
    | 'fall-down'
    | 'fall-up'
    | 'sway'
    | 'breathe'
    | 'spin'
    | 'spin-slow'
    | 'drift'
    | 'twinkle';

export type AnimationPackSectionType =
    'hero' | 'gallery' | 'story' | 'event' | 'footer' | 'full_page';

export interface AnimationAsset {
    id: number;
    asset_url: string;
    motion_type: MotionType;
    position_x: number;
    position_y: number;
    width_percent: number;
    opacity: number;
    duration_ms: number;
    delay_ms: number;
    repeat_count: number;
    z_index: number;
    sort_order: number;
}

export interface AnimationPack {
    id: number;
    name: string;
    slug: string;
    section: AnimationPackSectionType;
    section_label: string;
    thumbnail_url: string | null;
    available_for: PackageTier[];
    is_active: boolean;
    sort_order: number;
    assets_count?: number;
    assets?: AnimationAsset[];
}

export interface MotionOption {
    value: MotionType;
    label: string;
}

export interface AnimationPackSectionOption {
    value: AnimationPackSectionType;
    label: string;
}

export interface Package {
    value: PackageTier;
    label: string;
    price: number;
    duration_months: number | null;
    gallery_limit: number;
    features: string[];
}

export interface Addon {
    value: string;
    label: string;
    price: number;
    description: string;
}

export interface InvitationTemplate {
    id: number;
    name: string;
    slug: string;
    category: 'javanese' | 'sundanese' | 'batak' | 'modern';
    thumbnail: string | null;
    is_premium: boolean;
    min_package: PackageTier;
    /** Visual-builder node tree (raw; null when the template uses the default). */
    layout?: TemplateLayout | null;
    builder_version?: number;
    has_custom_layout?: boolean;
}

export interface GiftAccount {
    id: number;
    type: GiftType;
    provider_name: string;
    account_number: string;
    account_name: string;
    sort_order: number;
}

export interface GalleryPhoto {
    id: number;
    photo_url: string;
    sort_order: number;
}

export interface GuestBookEntry {
    id: number;
    name: string;
    message: string;
    created_at: string | null;
}

export interface PublicInvitation {
    id: number;
    slug: string;
    status: InvitationStatus;
    package: PackageTier | null;
    active_until: string | null;
    template_id: number | null;
    groom_name: string | null;
    bride_name: string | null;
    wedding_date: string | null;
    timezone: Timezone;
    akad_venue: string | null;
    akad_address: string | null;
    akad_datetime: string | null;
    resepsi_venue: string | null;
    resepsi_address: string | null;
    resepsi_datetime: string | null;
    maps_url_akad: string | null;
    maps_url_resepsi: string | null;
    cover_photo: string | null;
    love_story: string | null;
    music_url: string | null;
    visitor_count: number;
    public_url: string;
    template: InvitationTemplate | null;
    /** Resolved layout tree — always present (falls back to the Classic tree). */
    layout: TemplateLayout;
    gift_accounts: GiftAccount[];
    gallery_photos: GalleryPhoto[];
    has_guest_book: boolean;
    guest_book_entries?: GuestBookEntry[];
    animations?: InvitationAnimations;
    animation_pack_slug: string | null;
    animation_pack?: AnimationPack | null;
}
