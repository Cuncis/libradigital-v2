<?php

namespace App\Models;

use App\Enums\Addon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $order_id
 * @property Addon $addon
 * @property int $price
 * @property-read Order $order
 */
class OrderAddon extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'addon' => Addon::class,
        ];
    }

    /**
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
