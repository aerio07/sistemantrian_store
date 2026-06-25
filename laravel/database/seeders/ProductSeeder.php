<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        Product::create([
            'name' => 'Kopi Latte',
            'description' => 'Kopi susu creamy',
            'price' => 18000,
            'stock' => 50,
        ]);

        Product::create([
            'name' => 'Americano',
            'description' => 'Kopi hitam',
            'price' => 15000,
            'stock' => 40,
        ]);

        Product::create([
            'name' => 'Croissant',
            'description' => 'Roti butter',
            'price' => 12000,
            'stock' => 30,
        ]);

        Product::create([
            'name' => 'Donat Coklat',
            'description' => 'Donat topping coklat',
            'price' => 10000,
            'stock' => 25,
        ]);
    }
}