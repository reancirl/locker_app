<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Pc;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'cashier@bethelhub.com'],
            [
                'name' => 'Cashier',
                'username' => 'cashier',
                'role' => 'cashier',
                'email_verified_at' => Carbon::now('Asia/Manila'),
                'password' => Hash::make('isaiah6022'),
            ]
        );
    }
}
