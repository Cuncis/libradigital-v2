<?php

namespace App\Models;

use App\Enums\Package;
use App\Enums\TemplateCategory;
use Database\Factories\TemplateFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property TemplateCategory $category
 * @property string|null $thumbnail
 * @property array<string, mixed>|null $layout
 * @property array<string, mixed>|null $cover
 * @property int $builder_version
 * @property bool $is_premium
 * @property Package $min_package
 * @property bool $is_active
 */
class Template extends Model
{
    /** @use HasFactory<TemplateFactory> */
    use HasFactory;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'category' => TemplateCategory::class,
            'layout' => 'array',
            'cover' => 'array',
            'builder_version' => 'integer',
            'is_premium' => 'boolean',
            'min_package' => Package::class,
            'is_active' => 'boolean',
        ];
    }

    /**
     * Whether the given package tier is high enough to use this template.
     */
    public function isAvailableFor(Package $package): bool
    {
        return $package->includes($this->min_package);
    }

    /**
     * The template's layout, or the "Classic" tree when it has none yet. The
     * public page always renders through a tree, so this guarantees one.
     *
     * @return array<string, mixed>
     */
    public function resolvedLayout(): array
    {
        return $this->layout ?? self::defaultLayout();
    }

    /**
     * The template's cover tree, or the default cover when it has none yet.
     * Used by the builder to always give the superadmin a base to edit.
     *
     * @return array<string, mixed>
     */
    public function resolvedCover(): array
    {
        return $this->cover ?? self::defaultCover();
    }

    /**
     * The "Classic" layout node tree — a faithful reproduction of the original
     * hardcoded invitation page, expressed in the builder's node schema. Shared
     * by the seeder, factory, and parity test as the single source of truth.
     *
     * @return array<string, mixed>
     */
    public static function defaultLayout(): array
    {
        $sectionTitle = ['font' => 'heading', 'size' => '3xl', 'weight' => 'semibold', 'color' => 'accent-strong'];
        $bindSlug = ['kind' => 'bind', 'field' => 'ctx.slug'];
        $couple = ['kind' => 'template', 'parts' => [
            ['kind' => 'bind', 'field' => 'groom_name'],
            ['kind' => 'literal', 'value' => ' & '],
            ['kind' => 'bind', 'field' => 'bride_name'],
        ]];

        return [
            'version' => 1,
            'root' => [
                'id' => 'root',
                'type' => 'container',
                'layout' => 'stack',
                'style' => [],
                'children' => [
                    // 1. Hero
                    [
                        'id' => 'sec_hero',
                        'type' => 'section',
                        'variant' => 'hero',
                        'backgroundImage' => ['kind' => 'bind', 'field' => 'cover_photo'],
                        'style' => ['align' => 'center'],
                        'animationRef' => ['reveal' => 'zoom', 'revealSection' => 'header', 'packSection' => 'hero'],
                        'children' => [
                            ['id' => 'hero_eyebrow', 'type' => 'text', 'tag' => 'eyebrow', 'style' => ['size' => 'sm', 'tracking' => 'widest', 'case' => 'upper'], 'value' => ['kind' => 'literal', 'value' => 'The Wedding Of']],
                            ['id' => 'hero_names', 'type' => 'text', 'tag' => 'h1', 'style' => ['font' => 'heading', 'size' => '5xl', 'weight' => 'semibold'], 'value' => $couple],
                            ['id' => 'hero_date', 'type' => 'text', 'tag' => 'p', 'style' => ['size' => 'lg'], 'visibleWhen' => ['when' => 'notEmpty', 'field' => 'wedding_date'], 'value' => ['kind' => 'bind', 'field' => 'wedding_date', 'format' => 'date']],
                            ['id' => 'hero_greeting', 'type' => 'widget', 'widget' => 'guest_greeting', 'style' => [], 'bindings' => ['variant' => ['kind' => 'literal', 'value' => 'card']]],
                        ],
                    ],
                    // 2. Countdown
                    [
                        'id' => 'sec_countdown',
                        'type' => 'section',
                        'variant' => 'default',
                        'style' => ['align' => 'center'],
                        'visibleWhen' => ['when' => 'notEmpty', 'field' => 'wedding_date'],
                        'animationRef' => ['reveal' => 'fade', 'revealSection' => 'countdown'],
                        'children' => [
                            ['id' => 'cd_title', 'type' => 'text', 'tag' => 'h2', 'style' => $sectionTitle, 'value' => ['kind' => 'literal', 'value' => 'Menuju Hari Bahagia']],
                            ['id' => 'cd_widget', 'type' => 'widget', 'widget' => 'countdown', 'style' => [], 'bindings' => ['target' => ['kind' => 'bind', 'field' => 'wedding_date']]],
                        ],
                    ],
                    // 3 + 4. Akad & Resepsi
                    [
                        'id' => 'sec_events',
                        'type' => 'section',
                        'variant' => 'default',
                        'style' => [],
                        'animationRef' => ['packSection' => 'event'],
                        'children' => [
                            [
                                'id' => 'events_grid',
                                'type' => 'container',
                                'layout' => 'grid',
                                'columns' => 2,
                                'gap' => 'md',
                                'style' => [],
                                'children' => [
                                    ['id' => 'ev_akad', 'type' => 'widget', 'widget' => 'event', 'style' => [], 'bindings' => [
                                        'title' => ['kind' => 'literal', 'value' => 'Akad Nikah'],
                                        'datetime' => ['kind' => 'bind', 'field' => 'akad_datetime'],
                                        'venue' => ['kind' => 'bind', 'field' => 'akad_venue'],
                                        'address' => ['kind' => 'bind', 'field' => 'akad_address'],
                                        'mapsUrl' => ['kind' => 'bind', 'field' => 'maps_url_akad'],
                                    ]],
                                    ['id' => 'ev_resepsi', 'type' => 'widget', 'widget' => 'event', 'style' => [], 'bindings' => [
                                        'title' => ['kind' => 'literal', 'value' => 'Resepsi'],
                                        'datetime' => ['kind' => 'bind', 'field' => 'resepsi_datetime'],
                                        'venue' => ['kind' => 'bind', 'field' => 'resepsi_venue'],
                                        'address' => ['kind' => 'bind', 'field' => 'resepsi_address'],
                                        'mapsUrl' => ['kind' => 'bind', 'field' => 'maps_url_resepsi'],
                                    ]],
                                ],
                            ],
                        ],
                    ],
                    // 5. Love Story
                    [
                        'id' => 'sec_story',
                        'type' => 'section',
                        'variant' => 'default',
                        'style' => [],
                        'visibleWhen' => ['when' => 'notEmpty', 'field' => 'love_story'],
                        'animationRef' => ['reveal' => 'slide_left', 'revealSection' => 'love_story', 'packSection' => 'story'],
                        'children' => [
                            ['id' => 'story_title', 'type' => 'text', 'tag' => 'h2', 'style' => $sectionTitle, 'value' => ['kind' => 'literal', 'value' => 'Kisah Kami']],
                            ['id' => 'story_widget', 'type' => 'widget', 'widget' => 'love_story', 'style' => [], 'bindings' => ['story' => ['kind' => 'bind', 'field' => 'love_story']]],
                        ],
                    ],
                    // 6. Gallery
                    [
                        'id' => 'sec_gallery',
                        'type' => 'section',
                        'variant' => 'default',
                        'style' => ['maxWidth' => '4xl'],
                        'animationRef' => ['packSection' => 'gallery'],
                        'visibleWhen' => ['when' => 'arrayNotEmpty', 'source' => 'gallery_photos'],
                        'children' => [
                            ['id' => 'gallery_title', 'type' => 'text', 'tag' => 'h2', 'style' => $sectionTitle, 'value' => ['kind' => 'literal', 'value' => 'Galeri']],
                            ['id' => 'gallery_widget', 'type' => 'widget', 'widget' => 'gallery', 'style' => [], 'bindings' => []],
                        ],
                    ],
                    // 7. RSVP
                    [
                        'id' => 'sec_rsvp',
                        'type' => 'section',
                        'variant' => 'default',
                        'style' => ['align' => 'center'],
                        'animationRef' => ['reveal' => 'slide_up', 'revealSection' => 'rsvp'],
                        'children' => [
                            ['id' => 'rsvp_title', 'type' => 'text', 'tag' => 'h2', 'style' => $sectionTitle, 'value' => ['kind' => 'literal', 'value' => 'Konfirmasi Kehadiran']],
                            ['id' => 'rsvp_greeting', 'type' => 'widget', 'widget' => 'guest_greeting', 'style' => [], 'bindings' => ['variant' => ['kind' => 'literal', 'value' => 'inline']]],
                            ['id' => 'rsvp_widget', 'type' => 'widget', 'widget' => 'rsvp', 'style' => [], 'bindings' => ['slug' => $bindSlug]],
                        ],
                    ],
                    // 7b. Guest book (guest_book add-on)
                    [
                        'id' => 'sec_guestbook',
                        'type' => 'section',
                        'variant' => 'default',
                        'style' => [],
                        'visibleWhen' => ['when' => 'addon', 'addon' => 'guest_book'],
                        'children' => [
                            ['id' => 'gb_title', 'type' => 'text', 'tag' => 'h2', 'style' => $sectionTitle, 'value' => ['kind' => 'literal', 'value' => 'Buku Tamu']],
                            ['id' => 'gb_intro', 'type' => 'text', 'tag' => 'p', 'style' => ['color' => 'muted'], 'value' => ['kind' => 'literal', 'value' => 'Tinggalkan ucapan dan doa untuk kedua mempelai.']],
                            ['id' => 'gb_widget', 'type' => 'widget', 'widget' => 'guest_book', 'style' => [], 'bindings' => ['slug' => $bindSlug]],
                        ],
                    ],
                    // 8. Digital Gift
                    [
                        'id' => 'sec_gift',
                        'type' => 'section',
                        'variant' => 'default',
                        'style' => ['align' => 'center'],
                        'visibleWhen' => ['when' => 'arrayNotEmpty', 'source' => 'gift_accounts'],
                        'animationRef' => ['reveal' => 'zoom', 'revealSection' => 'gift'],
                        'children' => [
                            ['id' => 'gift_title', 'type' => 'text', 'tag' => 'h2', 'style' => $sectionTitle, 'value' => ['kind' => 'literal', 'value' => 'Angpao Digital']],
                            ['id' => 'gift_intro', 'type' => 'text', 'tag' => 'p', 'style' => ['color' => 'muted'], 'value' => ['kind' => 'literal', 'value' => 'Doa restu Anda merupakan karunia yang sangat berarti. Jika memberi tanda kasih, dapat melalui:']],
                            ['id' => 'gift_widget', 'type' => 'widget', 'widget' => 'gift', 'style' => [], 'bindings' => []],
                        ],
                    ],
                    // 9. WhatsApp share
                    [
                        'id' => 'sec_wa',
                        'type' => 'section',
                        'variant' => 'default',
                        'style' => ['align' => 'center'],
                        'children' => [
                            ['id' => 'wa_widget', 'type' => 'widget', 'widget' => 'wa_share', 'style' => [], 'bindings' => ['slug' => $bindSlug]],
                        ],
                    ],
                    // 10 + 11. Visitor counter + footer
                    [
                        'id' => 'sec_footer',
                        'type' => 'section',
                        'variant' => 'footer',
                        'style' => [],
                        'animationRef' => ['packSection' => 'footer'],
                        'children' => [
                            ['id' => 'footer_visitor', 'type' => 'widget', 'widget' => 'visitor_counter', 'style' => [], 'bindings' => ['slug' => $bindSlug]],
                            ['id' => 'footer_couple', 'type' => 'text', 'tag' => 'p', 'style' => ['font' => 'heading', 'size' => 'lg'], 'value' => $couple],
                            ['id' => 'footer_credit', 'type' => 'text', 'tag' => 'p', 'style' => ['size' => 'xs', 'color' => 'muted'], 'value' => ['kind' => 'literal', 'value' => 'Dibuat dengan 🤍 di libradigital.id']],
                        ],
                    ],
                ],
            ],
        ];
    }

    /**
     * The default cover ("Buka Undangan" screen) node tree. A full-screen hero
     * section with the couple's cover photo, names, date, and the open button.
     * Shared by the builder seed and factory as the single source of truth.
     *
     * @return array<string, mixed>
     */
    public static function defaultCover(): array
    {
        $couple = ['kind' => 'template', 'parts' => [
            ['kind' => 'bind', 'field' => 'groom_name'],
            ['kind' => 'literal', 'value' => ' & '],
            ['kind' => 'bind', 'field' => 'bride_name'],
        ]];

        return [
            'version' => 1,
            'root' => [
                'id' => 'cover_root',
                'type' => 'section',
                'variant' => 'hero',
                'backgroundImage' => ['kind' => 'bind', 'field' => 'cover_photo'],
                'style' => ['align' => 'center', 'color' => 'white'],
                'children' => [
                    ['id' => 'cover_eyebrow', 'type' => 'text', 'tag' => 'eyebrow', 'style' => ['size' => 'sm', 'tracking' => 'widest', 'case' => 'upper', 'color' => 'white'], 'value' => ['kind' => 'literal', 'value' => 'The Wedding Of']],
                    ['id' => 'cover_names', 'type' => 'text', 'tag' => 'h1', 'style' => ['font' => 'heading', 'size' => '5xl', 'weight' => 'semibold', 'color' => 'white'], 'value' => $couple],
                    ['id' => 'cover_date', 'type' => 'text', 'tag' => 'p', 'style' => ['size' => 'lg', 'color' => 'white'], 'visibleWhen' => ['when' => 'notEmpty', 'field' => 'wedding_date'], 'value' => ['kind' => 'bind', 'field' => 'wedding_date', 'format' => 'date']],
                    ['id' => 'cover_greeting', 'type' => 'widget', 'widget' => 'guest_greeting', 'style' => [], 'bindings' => ['variant' => ['kind' => 'literal', 'value' => 'card']]],
                    ['id' => 'cover_button', 'type' => 'button', 'action' => 'open', 'style' => ['margin' => 'lg'], 'label' => ['kind' => 'literal', 'value' => 'Buka Undangan']],
                ],
            ],
        ];
    }

    /**
     * @return HasMany<Invitation, $this>
     */
    public function invitations(): HasMany
    {
        return $this->hasMany(Invitation::class);
    }
}
