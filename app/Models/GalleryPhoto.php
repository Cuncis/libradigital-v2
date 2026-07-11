<?php

namespace App\Models;

use Database\Factories\GalleryPhotoFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $invitation_id
 * @property string $photo_url
 * @property string|null $path
 * @property int $sort_order
 * @property-read Invitation $invitation
 */
class GalleryPhoto extends Model
{
    /** @use HasFactory<GalleryPhotoFactory> */
    use HasFactory;

    protected $guarded = [];

    /**
     * @return BelongsTo<Invitation, $this>
     */
    public function invitation(): BelongsTo
    {
        return $this->belongsTo(Invitation::class);
    }
}
