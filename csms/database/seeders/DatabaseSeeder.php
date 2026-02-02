<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Pc;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['username' => 'testuser'],
            [
                'name' => 'Test User',
                'email' => 'testuser@example.com',
                'password' => Hash::make('1234'),
                'pin' => Hash::make('1234'),
            ],
        );

        Pc::firstOrCreate(['device_id' => 'PC-01'], ['name' => 'Front PC', 'default_minutes' => 60]);
    }
}
