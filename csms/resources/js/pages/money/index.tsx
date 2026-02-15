import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Props {
    date: string;
    totals: {
        pc_sales: number;
        food_sales: number;
        cash_in: number;
        cash_out: number;
        total_sales: number;
        remittance: number;
        total_cash: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Money', href: '/money' },
];

export default function MoneyIndex({ date, totals }: Props) {
    const form = useForm({ date });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Money Monitoring" />
            <div className="flex flex-col gap-4 p-4">
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">Money Monitoring</h1>
                        <p className="text-sm text-neutral-500">Daily Summary</p>
                    </div>
                    <form
                        className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-600 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.get('/money', { preserveScroll: true });
                        }}
                    >
                        <span className="font-semibold uppercase tracking-wide text-neutral-500">Date</span>
                        <input
                            type="date"
                            value={form.data.date}
                            onChange={(event) => form.setData('date', event.target.value)}
                            className="rounded border border-neutral-200 bg-transparent px-2 py-1 text-xs dark:border-neutral-700"
                        />
                        <button
                            type="submit"
                            className="rounded bg-neutral-900 px-2 py-1 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
                            disabled={form.processing}
                        >
                            {form.processing ? 'Loading…' : 'Apply'}
                        </button>
                    </form>
                </header>

                <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                    <table className="min-w-full text-sm">
                        <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900">
                            <tr>
                                <th className="px-4 py-3">PC Sales</th>
                                <th className="px-4 py-3">Food Sales</th>
                                <th className="px-4 py-3">Cash In</th>
                                <th className="px-4 py-3">Cash Out</th>
                                <th className="px-4 py-3">Total Sales</th>
                                <th className="px-4 py-3">Remittance</th>
                                <th className="px-4 py-3 text-right">Total Cash</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-t border-neutral-100 dark:border-neutral-800">
                                <td className="px-4 py-3 font-semibold">{formatCurrency(totals.pc_sales)}</td>
                                <td className="px-4 py-3 font-semibold">{formatCurrency(totals.food_sales)}</td>
                                <td className="px-4 py-3">{formatCurrency(totals.cash_in)}</td>
                                <td className="px-4 py-3">{formatCurrency(totals.cash_out)}</td>
                                <td className="px-4 py-3 font-semibold">{formatCurrency(totals.total_sales)}</td>
                                <td className="px-4 py-3">{formatCurrency(totals.remittance)}</td>
                                <td className="px-4 py-3 text-right text-lg font-semibold">{formatCurrency(totals.total_cash)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 2,
    }).format(value);
}
