export type Timezone = 'WIB' | 'WITA' | 'WIT';
export type Attendance = 'hadir' | 'tidak_hadir' | 'ragu';
export type GiftType = 'bank' | 'ewallet';

export interface InvitationTemplate {
    id: number;
    name: string;
    slug: string;
    category: 'javanese' | 'sundanese' | 'batak' | 'modern';
    thumbnail: string | null;
    is_premium: boolean;
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

export interface PublicInvitation {
    id: number;
    slug: string;
    status: 'draft' | 'published';
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
    gift_accounts: GiftAccount[];
    gallery_photos: GalleryPhoto[];
}
