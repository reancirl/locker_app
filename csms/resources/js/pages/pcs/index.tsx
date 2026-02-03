import { Head, useForm } from '@inertiajs/react';
import { Monitor, Clock, Play } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Pc {
    id: number;
    device_id: string;
    name?: string | null;
    default_minutes: number;
    unlocked_until?: string | null;
    last_seen_at?: string | null;
    created_at: string;
}

interface Props {
    pcs: Pc[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'PCs', href: '/pcs' },
];

export default function PcIndex({ pcs }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="PCs" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
                        <Monitor className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold">PCs</h1>
                        <p className="text-sm text-neutral-500">All registered café PCs</p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-white shadow-sm dark:border-sidebar-border dark:bg-neutral-950">
                    <table className="min-w-full text-sm">
                        <thead className="bg-neutral-50 text-left text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
                            <tr>
                                <th className="px-4 py-3 font-medium">Device ID</th>
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium">Unlocks Until</th>
                                <th className="px-4 py-3 font-medium">Last Seen</th>
                                <th className="px-4 py-3 font-medium">Created</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pcs.length === 0 && (
                                <tr>
                                    <td className="px-4 py-4 text-center text-neutral-500" colSpan={5}>
                                        No PCs yet.
                                    </td>
                                </tr>
                            )}
                            {pcs.map((pc) => (
                                <tr
                                    key={pc.id}
                                    className="border-t border-neutral-100 last:border-b dark:border-neutral-800"
                                >
                                    <td className="px-4 py-3 font-semibold">{pc.device_id}</td>
                                    <td className="px-4 py-3">{pc.name ?? '—'}</td>
                                    <td className="px-4 py-3 flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-neutral-400" />
                                        {pc.unlocked_until ?? 'Locked'}
                                    </td>
                                    <td className="px-4 py-3">{pc.last_seen_at ?? '—'}</td>
                                    <td className="px-4 py-3 text-neutral-500">{new Date(pc.created_at).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right">
                                        <StartSessionForm pc={pc} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}

function StartSessionForm({ pc }: { pc: Pc }) {
    const form = useForm<{ minutes: number }>({ minutes: pc.default_minutes ?? 60 });

    return (
        <form
            className="flex items-center gap-2 justify-end"
            onSubmit={(e) => {
                e.preventDefault();
                form.post(`/pcs/${pc.id}/sessions/start`, { preserveScroll: true });
            }}
        >
            <input
                type="number"
                min={1}
                max={480}
                className="h-9 w-16 rounded border border-neutral-300 bg-transparent px-2 text-right text-sm dark:border-neutral-700"
                value={form.data.minutes}
                onChange={(e) => form.setData('minutes', Number(e.target.value))}
                title="Minutes"
            />
            <button
                type="submit"
                disabled={form.processing}
                className="inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
                <Play className="h-3.5 w-3.5" />
                {form.processing ? 'Starting…' : 'Start'}
            </button>
        </form>
    );
}
