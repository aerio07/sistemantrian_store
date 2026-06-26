<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ProductSeeder::class,
        ]);

        \App\Models\User::updateOrCreate(
            ['email' => 'kasir1@toko.com'],
            [
                'name' => 'Kasir 1',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
            ]
        );

        \App\Models\User::updateOrCreate(
            ['email' => 'kasir2@toko.com'],
            [
                'name' => 'Kasir 2',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
            ]
        );

        \App\Models\User::updateOrCreate(
            ['email' => 'kasir3@toko.com'],
            [
                'name' => 'Kasir 3',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
            ]
        );
    }
}