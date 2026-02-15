<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\PosSale;
use App\Models\PosSaleItem;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PosSaleController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'paid' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($data, $request) {
            $productIds = collect($data['items'])->pluck('product_id')->unique()->values();
            $products = Product::whereIn('id', $productIds)->get()->keyBy('id');
            $inventories = Inventory::whereIn('product_id', $productIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('product_id');

            $total = 0;
            $lineItems = [];

            foreach ($data['items'] as $item) {
                $product = $products->get($item['product_id']);
                if (!$product) {
                    return back()->withErrors(['items' => 'Product not found.']);
                }

                $inventory = $inventories->get($product->id);
                $available = $inventory?->quantity ?? 0;
                if ($available < $item['quantity']) {
                    return back()->withErrors(['items' => "Insufficient stock for {$product->name}."]);
                }

                $price = (float) $product->price;
                $subtotal = $price * $item['quantity'];
                $total += $subtotal;

                $lineItems[] = [
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'price' => $price,
                    'subtotal' => $subtotal,
                ];
            }

            $paid = (float) $data['paid'];
            if ($paid < $total) {
                return back()->withErrors(['paid' => 'Amount paid is less than total.']);
            }

            $change = $paid - $total;

            $sale = PosSale::create([
                'total' => $total,
                'paid' => $paid,
                'change' => $change,
                'user_id' => $request->user()?->id,
            ]);

            foreach ($lineItems as $line) {
                PosSaleItem::create([
                    'pos_sale_id' => $sale->id,
                    'product_id' => $line['product_id'],
                    'quantity' => $line['quantity'],
                    'price' => $line['price'],
                    'subtotal' => $line['subtotal'],
                ]);

                $inventory = $inventories->get($line['product_id']);
                if ($inventory) {
                    $inventory->quantity -= $line['quantity'];
                    $inventory->save();
                }
            }

            return back()->with('success', 'Sale recorded.');
        });
    }
}
