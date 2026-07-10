<?php

namespace Database\Factories;

use App\Enums\OrderStatus;
use App\Enums\Package;
use App\Models\Invitation;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    public function definition(): array
    {
        $package = fake()->randomElement(Package::cases());

        return [
            'user_id' => User::factory(),
            'invitation_id' => Invitation::factory(),
            'order_number' => 'INV-'.now()->format('Ymd').'-'.Str::upper(Str::random(6)),
            'status' => OrderStatus::Pending,
            'package' => $package,
            'base_amount' => $package->price(),
            'addon_amount' => 0,
            'total_amount' => $package->price(),
            'snap_token' => null,
            'midtrans_transaction_id' => null,
            'paid_at' => null,
        ];
    }

    public function paid(): static
    {
        return $this->state(fn () => [
            'status' => OrderStatus::Paid,
            'paid_at' => now(),
        ]);
    }
}
