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
    active_session?: {
        is_open: boolean;
        started_at?: string | null;
        ends_at?: string | null;
    } | null;
    is_overdue?: boolean;
    has_uncleared_session?: boolean;
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
                                    className={`border-t border-neutral-100 last:border-b dark:border-neutral-800 ${
                                        pc.is_overdue
                                            ? 'bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-100'
                                            : ''
                                    }`}
                                >
                                    <td className="px-4 py-3 font-semibold">{pc.device_id}</td>
                                    <td className="px-4 py-3">{pc.name ?? '—'}</td>
                                    <td className="px-4 py-3 flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-neutral-400" />
                                        {formatUnlockLabel(pc)}
                                    </td>
                                    <td className="px-4 py-3">{formatDateTime(pc.last_seen_at)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex w-full flex-col items-end gap-3">
                                            <StartSessionForm pc={pc} />
                                            <div className="flex w-full items-center justify-end gap-2">
                                                <StartTestButton pc={pc} disabled={!!pc.has_uncleared_session} />
                                                <PowerControls pc={pc} />
                                            </div>
                                        </div>
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
    const form = useForm<{ minutes: number; open: boolean }>({
        minutes: pc.default_minutes ?? 60,
        open: false,
    });
    const isBlocked = !!pc.has_uncleared_session;

    return (
        <form
            className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2"
            onSubmit={(e) => {
                e.preventDefault();
                if (isBlocked) return;
                form.post(`/pcs/${pc.id}/sessions/start`, { preserveScroll: true });
            }}
        >
            <div className="flex items-center justify-end gap-3">
                <input
                    type="number"
                    min={1}
                    max={480}
                    className="h-9 w-16 rounded border border-neutral-300 bg-transparent px-2 text-right text-sm dark:border-neutral-700"
                    value={form.data.minutes}
                    onChange={(e) => form.setData('minutes', Number(e.target.value))}
                    title="Minutes"
                    disabled={form.data.open || isBlocked}
                />
                <label className="inline-flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                    <input
                        type="checkbox"
                        checked={form.data.open}
                        onChange={(e) => form.setData('open', e.target.checked)}
                        disabled={isBlocked}
                    />
                    Open time
                </label>
            </div>
            <button
                type="submit"
                disabled={form.processing || isBlocked}
                className="inline-flex items-center gap-2 rounded bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
                <Play className="h-3.5 w-3.5" />
                {isBlocked ? 'Clear First' : form.processing ? 'Starting…' : form.data.open ? 'Start Open' : 'Start'}
            </button>
            {isBlocked && (
                <span className="col-span-2 text-right text-[10px] font-semibold uppercase tracking-wide text-red-600">
                    Session not cleared
                </span>
            )}
        </form>
    );
}

function StartTestButton({ pc, disabled }: { pc: Pc; disabled: boolean }) {
    const form = useForm({});

    return (
        <button
            type="button"
            disabled={form.processing || disabled}
            onClick={() => {
                if (!confirm(`Start test session for ${pc.device_id}?`)) return;
                form.post(`/pcs/${pc.id}/sessions/test`, { preserveScroll: true });
            }}
            className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-blue-700 transition hover:bg-blue-100 disabled:opacity-50 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-200"
        >
            {form.processing ? 'Starting…' : 'Open Test'}
        </button>
    );
}

function PowerControls({ pc }: { pc: Pc }) {
    const form = useForm<{ command: 'shutdown' | 'restart' }>({ command: 'shutdown' });

    const submit = (command: 'shutdown' | 'restart') => {
        const label = command === 'restart' ? 'Restart' : 'Shutdown';
        if (!confirm(`${label} ${pc.device_id}?`)) return;
        form.setData('command', command);
        form.post(`/pcs/${pc.id}/command`, { preserveScroll: true });
    };

    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={() => submit('shutdown')}
                disabled={form.processing}
                className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-red-700 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200"
            >
                Shutdown
            </button>
            <button
                type="button"
                onClick={() => submit('restart')}
                disabled={form.processing}
                className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-amber-700 transition hover:bg-amber-100 disabled:opacity-50 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200"
            >
                Restart
            </button>
        </div>
    );
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

function formatUnlockLabel(pc: Pc) {
    if (pc.active_session?.is_open) {
        return 'Open time';
    }
    if (pc.active_session?.ends_at) {
        return formatDateTime(pc.active_session.ends_at);
    }
    if (pc.unlocked_until) {
        return formatDateTime(pc.unlocked_until);
    }
    return 'Locked';
}
