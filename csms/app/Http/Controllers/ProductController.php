<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(): Response
    {
        $products = Product::with('inventory')
            ->orderBy('name')
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'price' => (float) $product->price,
                    'quantity' => $product->inventory?->quantity ?? 0,
                ];
            });

        return Inertia::render('products/index', [
            'products' => $products,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:100',
            'price' => 'required|numeric|min:0',
            'quantity' => 'nullable|integer|min:0',
        ]);

        $product = Product::create([
            'name' => $data['name'],
            'sku' => $data['sku'] ?? null,
            'price' => $data['price'],
        ]);

        Inventory::create([
            'product_id' => $product->id,
            'quantity' => $data['quantity'] ?? 0,
        ]);

        return back()->with('success', 'Product added.');
    }

    public function updateInventory(Request $request, Product $product): RedirectResponse
    {
        $data = $request->validate([
            'quantity' => 'required|integer|min:0',
        ]);

        $inventory = $product->inventory ?? Inventory::create([
            'product_id' => $product->id,
            'quantity' => 0,
        ]);

        $inventory->quantity = $data['quantity'];
        $inventory->save();

        return back()->with('success', 'Inventory updated.');
    }
}
