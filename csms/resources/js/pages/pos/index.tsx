import { Head, Link, router, useForm } from '@inertiajs/react';
import { ShoppingCart, Plus, Minus, Wallet, Coins, ReceiptText, ArrowLeft, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

interface ProductItem {
    id: number;
    name: string;
    sku?: string | null;
    price: number;
    quantity: number;
}

interface SaleItem {
    product_id: number;
    quantity: number;
}

interface SaleSummary {
    id: number;
    total: number;
    paid: number;
    change: number;
    created_at: string;
    items_count?: number;
}

interface CashMovement {
    id: number;
    type: string;
    amount: number;
    note?: string | null;
    created_at: string;
}

interface Props {
    products: ProductItem[];
    recent_sales: SaleSummary[];
    recent_movements: CashMovement[];
    sales_today: number;
}

export default function PosIndex({ products, recent_sales, recent_movements, sales_today }: Props) {
    const [query, setQuery] = useState('');
    const [cashProcessing, setCashProcessing] = useState(false);
    const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
    const filteredProducts = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) return products;
        return products.filter((product) => {
            const name = product.name.toLowerCase();
            const sku = product.sku?.toLowerCase() ?? '';
            return name.includes(term) || sku.includes(term);
        });
    }, [products, query]);

    const saleForm = useForm<{ items: SaleItem[]; paid: string }>({ items: [], paid: '' });
    const cashForm = useForm<{ amount: string; note: string }>({
        amount: '',
        note: '',
    });

    const total = saleForm.data.items.reduce((sum, item) => {
        const product = productMap.get(item.product_id);
        return product ? sum + product.price * item.quantity : sum;
    }, 0);

    const paidAmount = Number(saleForm.data.paid);
    const change = Math.max(0, (Number.isNaN(paidAmount) ? 0 : paidAmount) - total);
    const canCheckout = total > 0 && paidAmount >= total && !saleForm.processing;

    const updateQuantity = (productId: number, quantity: number) => {
        const product = productMap.get(productId);
        const maxQty = product?.quantity ?? 0;
        const safeQty = Math.min(Math.max(quantity, 0), maxQty);
        const next = saleForm.data.items
            .map((item) => (item.product_id === productId ? { ...item, quantity: safeQty } : item))
            .filter((item) => item.quantity > 0);
        saleForm.setData('items', next);
    };

    const addItem = (product: ProductItem) => {
        const existing = saleForm.data.items.find((item) => item.product_id === product.id);
        const maxQty = product.quantity;
        if (existing) {
            const nextQty = Math.min(existing.quantity + 1, maxQty);
            updateQuantity(product.id, nextQty);
        } else if (maxQty > 0) {
            saleForm.setData('items', [...saleForm.data.items, { product_id: product.id, quantity: 1 }]);
        }
    };

    const removeItem = (productId: number) => {
        saleForm.setData('items', saleForm.data.items.filter((item) => item.product_id !== productId));
    };

    const submitSale = () => {
        if (!canCheckout) return;
        if (!confirm(`Confirm sale for ${formatCurrency(total)}?`)) return;
        saleForm.post('/pos/sales', {
            preserveScroll: true,
            onSuccess: () => saleForm.reset('items', 'paid'),
        });
    };

    const submitCash = (type: 'cash_in' | 'cash_out' | 'remittance') => {
        const amount = Number(cashForm.data.amount);
        if (!amount || Number.isNaN(amount) || amount <= 0) return;
        const label = formatMovement(type);
        if (!confirm(`Confirm ${label} of ${formatCurrency(amount)}?`)) return;
        router.post(
            '/pos/cash-movements',
            {
                type,
                amount,
                note: cashForm.data.note,
            },
            {
                preserveScroll: true,
                onStart: () => setCashProcessing(true),
                onFinish: () => setCashProcessing(false),
                onSuccess: () => cashForm.reset('amount', 'note'),
            }
        );
    };

    return (
        <div className="min-h-screen bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
            <Head title="POS" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6">
                <header className="sticky top-0 z-10 flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800 dark:bg-neutral-950/80">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                            <ShoppingCart className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Point of Sale</div>
                            <div className="text-lg font-semibold">
                                {sales_today > 0 ? `Sales Today: ${formatCurrency(sales_today)}` : ''}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-900"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back
                        </Link>
                    </div>
                </header>

                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <section className="order-2 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm lg:order-1 dark:border-neutral-800 dark:bg-neutral-950">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Products</h2>
                                <p className="text-xs text-neutral-400">Tap a product to add it to the cart.</p>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-neutral-400" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Search products"
                                    className="h-9 w-full rounded-full border border-neutral-200 bg-transparent pl-8 pr-3 text-sm dark:border-neutral-700"
                                />
                            </div>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {filteredProducts.map((product) => (
                                <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => addItem(product)}
                                    disabled={product.quantity <= 0}
                                    className="flex items-center justify-between rounded-xl border border-neutral-200 px-3 py-3 text-left text-sm transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800"
                                >
                                    <div>
                                        <div className="font-semibold">{product.name}</div>
                                        <div className="text-xs text-neutral-500">{product.sku ?? '—'}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold">{formatCurrency(product.price)}</div>
                                        <div className="text-xs text-neutral-500">
                                            {product.quantity > 0 ? `Stock ${product.quantity}` : 'Out of stock'}
                                        </div>
                                    </div>
                                </button>
                            ))}
                            {filteredProducts.length === 0 && (
                                <div className="rounded-lg border border-dashed border-neutral-200 px-3 py-4 text-center text-sm text-neutral-500 dark:border-neutral-800">
                                    No products match your search.
                                </div>
                            )}
                        </div>
                    </section>

                    <aside className="order-1 space-y-4 lg:order-2">
                        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Cart</h2>
                            <div className="mt-4 space-y-3">
                                {saleForm.data.items.length === 0 && (
                                    <div className="rounded-lg border border-dashed border-neutral-200 px-3 py-4 text-center text-sm text-neutral-500 dark:border-neutral-800">
                                        Add products to start a sale.
                                    </div>
                                )}
                                {saleForm.data.items.map((item) => {
                                    const product = productMap.get(item.product_id);
                                    if (!product) return null;
                                    return (
                                        <div key={item.product_id} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800">
                                            <div>
                                                <div className="font-semibold">{product.name}</div>
                                                <div className="text-xs text-neutral-500">{formatCurrency(product.price)}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => updateQuantity(item.product_id, Math.max(0, item.quantity - 1))}
                                                    className="rounded border border-neutral-200 p-1 text-neutral-600 dark:border-neutral-700"
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={product.quantity}
                                                    value={item.quantity}
                                                    onChange={(event) => updateQuantity(item.product_id, Number(event.target.value))}
                                                    className="h-8 w-12 rounded border border-neutral-200 bg-transparent text-center text-sm dark:border-neutral-700"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => updateQuantity(item.product_id, Math.min(product.quantity, item.quantity + 1))}
                                                    className="rounded border border-neutral-200 p-1 text-neutral-600 dark:border-neutral-700"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold">{formatCurrency(product.price * item.quantity)}</div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(item.product_id)}
                                                    className="text-xs text-red-600 hover:underline"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-4 border-t border-neutral-200 pt-4 text-sm dark:border-neutral-800">
                                <div className="flex items-center justify-between">
                                    <span className="text-neutral-500">Total</span>
                                    <span className="text-lg font-semibold">{formatCurrency(total)}</span>
                                </div>
                                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                                    <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Paid</label>
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={saleForm.data.paid}
                                        onChange={(event) => saleForm.setData('paid', event.target.value)}
                                        className="h-9 w-full rounded border border-neutral-200 bg-transparent px-2 text-right text-sm sm:w-32 dark:border-neutral-700"
                                    />
                                </div>
                                <div className="mt-2 flex items-center justify-between text-sm">
                                    <span className="text-neutral-500">Change</span>
                                    <span className="font-semibold">{formatCurrency(change)}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={submitSale}
                                    disabled={!canCheckout}
                                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded bg-emerald-600 px-3 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    <ShoppingCart className="h-4 w-4" />
                                    {saleForm.processing ? 'Saving…' : 'Complete Sale'}
                                </button>
                                {!canCheckout && total > 0 && (
                                    <div className="mt-2 text-xs text-neutral-500">Paid amount must be at least the total.</div>
                                )}
                            </div>
                        </section>

                        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Cash Movements</h2>
                            <div className="mt-3 space-y-3 text-sm">
                                <label className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Amount</span>
                                    <input
                                        type="number"
                                        min={0.01}
                                        step="0.01"
                                        value={cashForm.data.amount}
                                        onChange={(event) => cashForm.setData('amount', event.target.value)}
                                        className="rounded border border-neutral-200 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
                                    />
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Note</span>
                                    <input
                                        type="text"
                                        value={cashForm.data.note}
                                        onChange={(event) => cashForm.setData('note', event.target.value)}
                                        className="rounded border border-neutral-200 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
                                        placeholder="Ice, supplies, remittance..."
                                    />
                                </label>
                                <div className="grid gap-2 sm:grid-cols-3">
                                    <button
                                        type="button"
                                        disabled={cashProcessing || !cashForm.data.amount}
                                        onClick={() => submitCash('cash_in')}
                                        className="inline-flex items-center justify-center gap-2 rounded bg-emerald-600 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                        <Wallet className="h-4 w-4" />
                                        Cash In
                                    </button>
                                    <button
                                        type="button"
                                        disabled={cashProcessing || !cashForm.data.amount}
                                        onClick={() => submitCash('cash_out')}
                                        className="inline-flex items-center justify-center gap-2 rounded bg-amber-600 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-amber-700 disabled:opacity-50"
                                    >
                                        <Coins className="h-4 w-4" />
                                        Cash Out
                                    </button>
                                    <button
                                        type="button"
                                        disabled={cashProcessing || !cashForm.data.amount}
                                        onClick={() => submitCash('remittance')}
                                        className="inline-flex items-center justify-center gap-2 rounded bg-blue-600 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        <ReceiptText className="h-4 w-4" />
                                        Remit
                                    </button>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Recent Sales</h2>
                        <div className="mt-4 space-y-2 text-sm">
                            {recent_sales.length === 0 && (
                                <div className="text-sm text-neutral-500">No sales yet.</div>
                            )}
                            {recent_sales.map((sale) => (
                                <div key={sale.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
                                    <div>
                                        <div className="font-semibold">Sale #{sale.id}</div>
                                        <div className="text-xs text-neutral-500">{formatDateTime(sale.created_at)}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold">{formatCurrency(sale.total)}</div>
                                        <div className="text-xs text-neutral-500">Change {formatCurrency(sale.change)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Recent Cash Movements</h2>
                        <div className="mt-4 space-y-2 text-sm">
                            {recent_movements.length === 0 && (
                                <div className="text-sm text-neutral-500">No cash movements yet.</div>
                            )}
                            {recent_movements.map((movement) => (
                                <div key={movement.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
                                    <div>
                                        <div className="font-semibold">{formatMovement(movement.type)}</div>
                                        <div className="text-xs text-neutral-500">{movement.note ?? '—'}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold">{formatCurrency(movement.amount)}</div>
                                        <div className="text-xs text-neutral-500">{formatDateTime(movement.created_at)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 2,
    }).format(value);
}

function formatDateTime(iso?: string | null) {
    if (!iso) return '—';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        hour12: false,
    });
}

function formatMovement(type: string) {
    switch (type) {
        case 'cash_in':
            return 'Cash In';
        case 'cash_out':
            return 'Cash Out';
        case 'remittance':
            return 'Remittance';
        default:
            return type;
    }
}
