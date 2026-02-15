<?php

namespace App\Http\Controllers;

use App\Models\CashMovement;
use App\Models\Product;
use App\Models\PosSale;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
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

        $recentSales = PosSale::withCount('items')
            ->orderByDesc('created_at')
            ->limit(8)
            ->get(['id', 'total', 'paid', 'change', 'created_at']);

        $recentMovements = CashMovement::orderByDesc('created_at')
            ->limit(8)
            ->get(['id', 'type', 'amount', 'note', 'created_at']);

        $today = Carbon::now('Asia/Manila')->startOfDay();
        $salesToday = PosSale::where('created_at', '>=', $today)->sum('total');

        return Inertia::render('pos/index', [
            'products' => $products,
            'recent_sales' => $recentSales,
            'recent_movements' => $recentMovements,
            'sales_today' => (float) $salesToday,
        ]);
    }
}
