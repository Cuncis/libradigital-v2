<?php

namespace App\Models;

use App\Enums\GiftType;
use Database\Factories\GiftAccountFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $invitation_id
 * @property GiftType $type
 * @property string $provider_name
 * @property string $account_number
 * @property string $account_name
 * @property int $sort_order
 * @property-read Invitation $invitation
 */
class GiftAccount extends Model
{
    /** @use HasFactory<GiftAccountFactory> */
    use HasFactory;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'type' => GiftType::class,
        ];
    }

    /**
     * @return BelongsTo<Invitation, $this>
     */
    public function invitation(): BelongsTo
    {
        return $this->belongsTo(Invitation::class);
    }
}
