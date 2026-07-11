<?php

namespace App\Models;

use Database\Factories\GuestBookEntryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $invitation_id
 * @property string $name
 * @property string $message
 * @property string|null $ip_address
 * @property Carbon|null $created_at
 * @property-read Invitation $invitation
 */
class GuestBookEntry extends Model
{
    /** @use HasFactory<GuestBookEntryFactory> */
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
