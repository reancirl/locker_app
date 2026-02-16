import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface MoneyRow {
    date: string;
    pc_sales: number;
    food_sales: number;
    cash_in: number;
    cash_out: number;
    total_sales: number;
    remittance: number;
    total_cash: number;
}

interface Props {
    range: {
        start: string;
        end: string;
    };
    rows: MoneyRow[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Money', href: '/money' },
];

export default function MoneyIndex({ range, rows }: Props) {
    const form = useForm({
        start: range.start,
        end: range.end,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Money Monitoring" />
            <div className="flex flex-col gap-4 p-4">
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">Money Monitoring</h1>
                        <p className="text-sm text-neutral-500">Daily summary by date range</p>
                    </div>
                    <form
                        className="flex flex-wrap items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-600 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.get('/money', { preserveScroll: true });
                        }}
                    >
                        <span className="font-semibold uppercase tracking-wide text-neutral-500">From</span>
                        <input
                            type="date"
                            value={form.data.start}
                            onChange={(event) => form.setData('start', event.target.value)}
                            className="rounded border border-neutral-200 bg-transparent px-2 py-1 text-xs dark:border-neutral-700"
                        />
                        <span className="text-neutral-400">to</span>
                        <input
                            type="date"
                            value={form.data.end}
                            onChange={(event) => form.setData('end', event.target.value)}
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
                                <th className="px-4 py-3">Date</th>
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
                            {rows.length === 0 && (
                                <tr>
                                    <td className="px-4 py-6 text-center text-neutral-500" colSpan={8}>
                                        No data for this range.
                                    </td>
                                </tr>
                            )}
                            {rows.map((row) => (
                                <tr key={row.date} className="border-t border-neutral-100 dark:border-neutral-800">
                                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{formatDate(row.date)}</td>
                                    <td className="px-4 py-3 font-semibold">{formatCurrency(row.pc_sales)}</td>
                                    <td className="px-4 py-3 font-semibold">{formatCurrency(row.food_sales)}</td>
                                    <td className="px-4 py-3">{formatCurrency(row.cash_in)}</td>
                                    <td className="px-4 py-3">{formatCurrency(row.cash_out)}</td>
                                    <td className="px-4 py-3 font-semibold">{formatCurrency(row.total_sales)}</td>
                                    <td className="px-4 py-3">{formatCurrency(row.remittance)}</td>
                                    <td className="px-4 py-3 text-right text-lg font-semibold">{formatCurrency(row.total_cash)}</td>
                                </tr>
                            ))}
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

function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-PH', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}
