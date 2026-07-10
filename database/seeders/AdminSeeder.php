<?php

namespace Database\Seeders;

use App\Enums\Plan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrNew(['email' => 'admin@libradigital.id']);

        $admin->forceFill([
            'name' => 'Super Admin',
            'password' => Hash::make('password'),
            'plan' => Plan::Premium,
            'is_admin' => true,
            'email_verified_at' => now(),
        ])->save();
    }
}
