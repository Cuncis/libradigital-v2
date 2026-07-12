<?php

namespace App\Models;

use App\Enums\Addon;
use App\Enums\InvitationStatus;
use App\Enums\Package;
use App\Enums\Timezone;
use Database\Factories\InvitationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $slug
 * @property InvitationStatus $status
 * @property bool $is_demo
 * @property Package|null $package
 * @property list<string>|null $addons
 * @property Carbon|null $active_until
 * @property int|null $template_id
 * @property string|null $groom_name
 * @property string|null $bride_name
 * @property Carbon|null $wedding_date
 * @property Timezone $timezone
 * @property string|null $akad_venue
 * @property string|null $akad_address
 * @property Carbon|null $akad_datetime
 * @property string|null $resepsi_venue
 * @property string|null $resepsi_address
 * @property Carbon|null $resepsi_datetime
 * @property string|null $maps_url_akad
 * @property string|null $maps_url_resepsi
 * @property string|null $cover_photo
 * @property string|null $cover_path
 * @property string|null $love_story
 * @property string|null $music_url
 * @property int $visitor_count
 * @property-read User $user
 * @property-read Template|null $template
 */
class Invitation extends Model
{
    /** @use HasFactory<InvitationFactory> */
    use HasFactory;

    // Mass-assignment is controlled by Form Requests (validated()) and explicit
    // arrays in the controller, so the model itself stays unguarded.
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'status' => InvitationStatus::class,
            'is_demo' => 'boolean',
            'package' => Package::class,
            'addons' => 'array',
            'timezone' => Timezone::class,
            'wedding_date' => 'datetime',
            'akad_datetime' => 'datetime',
            'resepsi_datetime' => 'datetime',
            'active_until' => 'date',
        ];
    }

    /**
     * Whether this invitation has purchased the given add-on.
     */
    public function hasAddon(Addon $addon): bool
    {
        return in_array($addon->value, $this->addons ?? [], true);
    }

    /**
     * Effective gallery photo allowance: the package limit plus any add-on
     * bonus. A draft (no package yet) uses the highest tier so building isn't
     * blocked before checkout.
     */
    public function galleryLimit(): int
    {
        $base = ($this->package ?? Package::Signature)->galleryLimit();

        return $base + ($this->hasAddon(Addon::ExtraGallery) ? 50 : 0);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function isDraft(): bool
    {
        return $this->status === InvitationStatus::Draft;
    }

    public function isActive(): bool
    {
        return $this->status === InvitationStatus::Active;
    }

    public function isExpired(): bool
    {
        return $this->status === InvitationStatus::Expired
            || ($this->active_until !== null && $this->active_until->lt(today()));
    }

    /**
     * Whether the invitation may be shown on its public URL: active and not past
     * its expiry date (active_until is a date, so the final day still counts).
     */
    public function isPubliclyVisible(): bool
    {
        return $this->status === InvitationStatus::Active
            && ($this->active_until === null || $this->active_until->gte(today()));
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Template, $this>
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }

    /**
     * @return HasMany<Rsvp, $this>
     */
    public function rsvps(): HasMany
    {
        return $this->hasMany(Rsvp::class);
    }

    /**
     * @return HasMany<GiftAccount, $this>
     */
    public function giftAccounts(): HasMany
    {
        return $this->hasMany(GiftAccount::class)->orderBy('sort_order');
    }

    /**
     * @return HasMany<GalleryPhoto, $this>
     */
    public function galleryPhotos(): HasMany
    {
        return $this->hasMany(GalleryPhoto::class)->orderBy('sort_order');
    }

    /**
     * @return HasMany<InvitationVisitor, $this>
     */
    public function visitors(): HasMany
    {
        return $this->hasMany(InvitationVisitor::class);
    }

    /**
     * @return HasMany<Order, $this>
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * @return HasMany<GuestBookEntry, $this>
     */
    public function guestBookEntries(): HasMany
    {
        return $this->hasMany(GuestBookEntry::class)->latest();
    }

    /**
     * Per-section animation choices, each pointing at a library Animation.
     *
     * @return HasMany<InvitationAnimation, $this>
     */
    public function animationSelections(): HasMany
    {
        return $this->hasMany(InvitationAnimation::class);
    }

    /**
     * The floating-overlay animation pack the couple chose (by slug).
     *
     * @return BelongsTo<AnimationPack, $this>
     */
    public function animationPack(): BelongsTo
    {
        return $this->belongsTo(AnimationPack::class, 'animation_pack_slug', 'slug');
    }
}
