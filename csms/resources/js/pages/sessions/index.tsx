import { Head, useForm } from '@inertiajs/react';
import { Clock3, User, Monitor } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface SessionItem {
    id: number;
    device_id: string;
    user_id?: number | null;
    started_at: string;
    ends_at: string;
    rate_type: string;
    rate_php: number;
    created_at: string;
    user?: {
        id: number;
        username: string;
        name?: string | null;
    } | null;
    pc?: {
        id: number;
        device_id: string;
        name?: string | null;
    } | null;
}

interface Props {
    sessions: SessionItem[];
    now: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Active Sessions', href: '/sessions' },
];

export default function SessionsIndex({ sessions, now }: Props) {
    const nowDate = new Date(now);
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Active Sessions" />
            <div className="flex flex-col gap-4 p-4">
                <header className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-neutral-900 dark:text-emerald-300">
                        <Clock3 className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold">Active Sessions</h1>
                        <p className="text-sm text-neutral-500">Currently running sessions only</p>
                    </div>
                </header>

                <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                    <table className="min-w-full text-sm">
                        <thead className="bg-neutral-50 text-left text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
                            <tr className="text-xs font-semibold uppercase tracking-wide">
                                <th className="px-4 py-3">PC</th>
                                <th className="px-4 py-3">User</th>
                                <th className="px-4 py-3">Rate</th>
                                <th className="px-4 py-3">Used</th>
                                <th className="px-4 py-3">Started</th>
                                <th className="px-4 py-3">Ends</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.length === 0 && (
                                <tr>
                                    <td className="px-4 py-8 text-center text-neutral-500" colSpan={7}>
                                        No active sessions.
                                    </td>
                                </tr>
                            )}
                            {sessions.map((session) => (
                                <tr
                                    key={session.id}
                                    className="border-t border-neutral-100 last:border-b dark:border-neutral-800"
                                >
                                    <td className="px-4 py-3 flex items-center gap-2 font-semibold">
                                        <Monitor className="h-4 w-4 text-neutral-400" />
                                        <div className="leading-tight">
                                            <div>{session.pc?.name ?? session.device_id}</div>
                                            <div className="text-xs text-neutral-500">{session.device_id}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 flex items-center gap-2">
                                        <User className="h-4 w-4 text-neutral-400" />
                                        {session.user?.username ?? 'Walk-in'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="capitalize">{session.rate_type}</span>
                                        <span className="ml-1 font-semibold">· ₱{session.rate_php}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {formatDuration(nowDate, new Date(session.started_at))}
                                    </td>
                                    <td className="px-4 py-3">{new Date(session.started_at).toLocaleString()}</td>
                                    <td className="px-4 py-3">{new Date(session.ends_at).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right">
                                        <EndSessionButton sessionId={session.id} endsAt={session.ends_at} />
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

function EndSessionButton({ sessionId, endsAt }: { sessionId: number; endsAt: string }) {
    const form = useForm({});
    const inFuture = new Date(endsAt).getTime() > Date.now();

    if (!inFuture) {
        return <span className="text-xs text-neutral-500">Ended</span>;
    }

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                form.post(`/sessions/${sessionId}/end`, { preserveScroll: true });
            }}
        >
            <button
                type="submit"
                disabled={form.processing}
                className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
                {form.processing ? 'Ending…' : 'End Now'}
            </button>
        </form>
    );
}

function formatDuration(now: Date, start: Date) {
    const diffMs = Math.max(0, now.getTime() - start.getTime());
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
}
