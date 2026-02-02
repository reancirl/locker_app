import { Head } from '@inertiajs/react';
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
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Sessions', href: '/sessions' },
];

export default function SessionsIndex({ sessions }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sessions" />
            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
                        <Clock3 className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold">Active & Recent Sessions</h1>
                        <p className="text-sm text-neutral-500">Last 100 sessions</p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-white shadow-sm dark:border-sidebar-border dark:bg-neutral-950">
                    <table className="min-w-full text-sm">
                        <thead className="bg-neutral-50 text-left text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
                            <tr>
                                <th className="px-4 py-3 font-medium">PC</th>
                                <th className="px-4 py-3 font-medium">User</th>
                                <th className="px-4 py-3 font-medium">Rate</th>
                                <th className="px-4 py-3 font-medium">Started</th>
                                <th className="px-4 py-3 font-medium">Ends</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.length === 0 && (
                                <tr>
                                    <td className="px-4 py-4 text-center text-neutral-500" colSpan={5}>
                                        No sessions yet.
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
                                        {session.pc?.name ?? session.device_id}
                                    </td>
                                    <td className="px-4 py-3 flex items-center gap-2">
                                        <User className="h-4 w-4 text-neutral-400" />
                                        {session.user?.username ?? 'Walk-in'}
                                    </td>
                                    <td className="px-4 py-3 capitalize">
                                        {session.rate_type} · ₱{session.rate_php}
                                    </td>
                                    <td className="px-4 py-3">{new Date(session.started_at).toLocaleString()}</td>
                                    <td className="px-4 py-3">{new Date(session.ends_at).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
