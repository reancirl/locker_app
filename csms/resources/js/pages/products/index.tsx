import { Head, useForm } from '@inertiajs/react';
import { PackagePlus, Boxes } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface ProductItem {
    id: number;
    name: string;
    sku?: string | null;
    price: number;
    quantity: number;
}

interface Props {
    products: ProductItem[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Products', href: '/products' },
];

export default function ProductsIndex({ products }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />
            <div className="flex flex-col gap-4 p-4">
                <header className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
                        <Boxes className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold">Products</h1>
                        <p className="text-sm text-neutral-500">Manage products and inventory</p>
                    </div>
                </header>

                <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
                    <AddProductCard />
                    <ProductsTable products={products} />
                </div>
            </div>
        </AppLayout>
    );
}

function AddProductCard() {
    const form = useForm({
        name: '',
        sku: '',
        price: 0,
        quantity: 0,
    });

    return (
        <form
            className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
            onSubmit={(event) => {
                event.preventDefault();
                form.post('/products', { preserveScroll: true, onSuccess: () => form.reset('name', 'sku') });
            }}
        >
            <header className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
                    <PackagePlus className="h-4 w-4" />
                </div>
                <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Add Product</h2>
                    <p className="text-xs text-neutral-400">Create new product and set stock</p>
                </div>
            </header>

            <div className="mt-4 space-y-3 text-sm">
                <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Name</span>
                    <input
                        type="text"
                        value={form.data.name}
                        onChange={(event) => form.setData('name', event.target.value)}
                        className="rounded border border-neutral-200 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
                        placeholder="Snack Pack"
                        required
                    />
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">SKU (optional)</span>
                    <input
                        type="text"
                        value={form.data.sku}
                        onChange={(event) => form.setData('sku', event.target.value)}
                        className="rounded border border-neutral-200 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
                        placeholder="SKU-001"
                    />
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Price (PHP)</span>
                        <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={form.data.price}
                            onChange={(event) => form.setData('price', Number(event.target.value))}
                            className="rounded border border-neutral-200 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Starting Qty</span>
                        <input
                            type="number"
                            min={0}
                            step="1"
                            value={form.data.quantity}
                            onChange={(event) => form.setData('quantity', Number(event.target.value))}
                            className="rounded border border-neutral-200 bg-transparent px-3 py-2 text-sm dark:border-neutral-700"
                        />
                    </label>
                </div>
                <button
                    type="submit"
                    disabled={form.processing}
                    className="inline-flex w-full items-center justify-center gap-2 rounded bg-emerald-600 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                    {form.processing ? 'Saving…' : 'Add Product'}
                </button>
            </div>
        </form>
    );
}

function ProductsTable({ products }: { products: ProductItem[] }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <table className="min-w-full text-sm">
                <thead className="bg-neutral-50 text-left text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
                    <tr className="text-xs font-semibold uppercase tracking-wide">
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Inventory</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.length === 0 && (
                        <tr>
                            <td className="px-4 py-6 text-center text-neutral-500" colSpan={4}>
                                No products yet.
                            </td>
                        </tr>
                    )}
                    {products.map((product) => (
                        <ProductRow key={product.id} product={product} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ProductRow({ product }: { product: ProductItem }) {
    const form = useForm({ quantity: product.quantity });

    return (
        <tr className="border-t border-neutral-100 dark:border-neutral-800">
            <td className="px-4 py-3">
                <div className="font-semibold">{product.name}</div>
                <div className="text-xs text-neutral-500">{product.sku ?? '—'}</div>
            </td>
            <td className="px-4 py-3">₱{product.price.toFixed(2)}</td>
            <td className="px-4 py-3">
                <input
                    type="number"
                    min={0}
                    step="1"
                    value={form.data.quantity}
                    onChange={(event) => form.setData('quantity', Number(event.target.value))}
                    className="h-9 w-24 rounded border border-neutral-200 bg-transparent px-2 text-sm dark:border-neutral-700"
                />
            </td>
            <td className="px-4 py-3 text-right">
                <button
                    type="button"
                    disabled={form.processing}
                    onClick={() => form.patch(`/products/${product.id}/inventory`, { preserveScroll: true })}
                    className="rounded bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
                >
                    {form.processing ? 'Saving…' : 'Update'}
                </button>
            </td>
        </tr>
    );
}
