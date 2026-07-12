<?php

namespace App\Models;

use App\Enums\AnimationSection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvitationAnimation extends Model
{
    protected $fillable = [
        'invitation_id',
        'section',
        'animation_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'section' => AnimationSection::class,
        ];
    }

    /**
     * @return BelongsTo<Invitation, $this>
     */
    public function invitation(): BelongsTo
    {
        return $this->belongsTo(Invitation::class);
    }

    /**
     * @return BelongsTo<Animation, $this>
     */
    public function animation(): BelongsTo
    {
        return $this->belongsTo(Animation::class);
    }
}
