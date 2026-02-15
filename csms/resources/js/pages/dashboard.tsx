import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Activity, Clock3, Monitor, PhilippinePeso, AlertTriangle, Server } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface DashboardProps {
    range: {
        start: string;
        end: string;
    };
    totals: {
        sales: number;
        sessions: number;
        avg_minutes: number;
        total_minutes: number;
    };
    counts: {
        active_sessions: number;
        open_sessions: number;
        overdue_sessions: number;
        online_pcs: number;
        offline_pcs: number;
        total_pcs: number;
    };
    top_pcs: Array<{
        device_id: string;
        name?: string | null;
        minutes: number;
        revenue: number;
    }>;
    overdue_sessions: Array<{
        id: number;
        device_id: string;
        name?: string | null;
        ends_at?: string | null;
        last_seen_at?: string | null;
    }>;
}

export default function Dashboard({ range, totals, counts, top_pcs, overdue_sessions }: DashboardProps) {
    const rangeLabel = formatRange(range.start, range.end);
    const salesLabel = formatCurrency(totals.sales);
    const avgLabel = formatDuration(totals.avg_minutes);
    const totalHoursLabel = formatHours(totals.total_minutes);
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="text-2xl font-semibold">Weekly Summary</h1>
                        <p className="text-sm text-neutral-500">{rangeLabel}</p>
                    </div>
                    <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200">
                        Sales This Week
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <SummaryCard
                        title="Total Sales"
                        value={salesLabel}
                        sub="PHP, this week"
                        icon={<PhilippinePeso className="h-5 w-5" />}
                        tone="emerald"
                    />
                    <SummaryCard
                        title="Total Sessions"
                        value={totals.sessions.toString()}
                        sub="Sessions started"
                        icon={<Activity className="h-5 w-5" />}
                        tone="blue"
                    />
                    <SummaryCard
                        title="Avg Session Length"
                        value={avgLabel}
                        sub="Average time used"
                        icon={<Clock3 className="h-5 w-5" />}
                        tone="amber"
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <MiniCard label="Active Sessions" value={counts.active_sessions} />
                    <MiniCard label="Open Sessions" value={counts.open_sessions} />
                    <MiniCard label="Overdue Sessions" value={counts.overdue_sessions} alert />
                    <MiniCard label="Online PCs" value={`${counts.online_pcs}/${counts.total_pcs}`} />
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 lg:col-span-2">
                        <header className="flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Top PCs</h2>
                                <p className="text-xs text-neutral-400">By revenue this week</p>
                            </div>
                            <div className="text-xs font-semibold text-neutral-500">Total Hours {totalHoursLabel}</div>
                        </header>
                        <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
                            <table className="min-w-full text-sm">
                                <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900">
                                    <tr>
                                        <th className="px-4 py-2">PC</th>
                                        <th className="px-4 py-2">Hours</th>
                                        <th className="px-4 py-2 text-right">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {top_pcs.length === 0 && (
                                        <tr>
                                            <td className="px-4 py-4 text-center text-neutral-500" colSpan={3}>
                                                No sessions yet.
                                            </td>
                                        </tr>
                                    )}
                                    {top_pcs.map((pc) => (
                                        <tr key={pc.device_id} className="border-t border-neutral-100 dark:border-neutral-800">
                                            <td className="px-4 py-3">
                                                <div className="font-semibold">{pc.name ?? pc.device_id}</div>
                                                <div className="text-xs text-neutral-500">{pc.device_id}</div>
                                            </td>
                                            <td className="px-4 py-3">{formatHours(pc.minutes)}</td>
                                            <td className="px-4 py-3 text-right font-semibold">
                                                {formatCurrency(pc.revenue)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                        <header className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200">
                                <AlertTriangle className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Overdue</h2>
                                <p className="text-xs text-neutral-400">Still online after time</p>
                            </div>
                        </header>
                        <div className="mt-4 space-y-3">
                            {overdue_sessions.length === 0 && (
                                <div className="rounded-lg border border-dashed border-neutral-200 px-3 py-4 text-center text-sm text-neutral-500 dark:border-neutral-800">
                                    No overdue sessions.
                                </div>
                            )}
                            {overdue_sessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="rounded-lg border border-red-100 bg-red-50/60 px-3 py-2 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-100"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="font-semibold">
                                            {session.name ?? session.device_id}
                                            <span className="ml-2 text-xs font-normal text-red-700/80">
                                                {session.device_id}
                                            </span>
                                        </div>
                                        <div className="text-xs">{formatDateTime(session.ends_at)}</div>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-red-700/80">
                                        <Monitor className="h-3.5 w-3.5" />
                                        Last seen {formatDateTime(session.last_seen_at)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <InfoCard
                        title="PC Status"
                        icon={<Server className="h-4 w-4" />}
                        items={[
                            { label: 'Online', value: counts.online_pcs.toString() },
                            { label: 'Offline', value: counts.offline_pcs.toString() },
                            { label: 'Total', value: counts.total_pcs.toString() },
                        ]}
                    />
                    <InfoCard
                        title="Session Health"
                        icon={<Activity className="h-4 w-4" />}
                        items={[
                            { label: 'Active', value: counts.active_sessions.toString() },
                            { label: 'Open', value: counts.open_sessions.toString() },
                            { label: 'Overdue', value: counts.overdue_sessions.toString() },
                        ]}
                    />
                </div>
            </div>
        </AppLayout>
    );
}

function SummaryCard({
    title,
    value,
    sub,
    icon,
    tone,
}: {
    title: string;
    value: string;
    sub: string;
    icon: ReactNode;
    tone: 'emerald' | 'blue' | 'amber';
}) {
    const tones = {
        emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200',
        blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200',
        amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200',
    } as const;

    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</div>
                    <div className="mt-2 text-2xl font-semibold">{value}</div>
                    <div className="mt-1 text-xs text-neutral-500">{sub}</div>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

function MiniCard({ label, value, alert }: { label: string; value: string | number; alert?: boolean }) {
    return (
        <div
            className={`rounded-xl border px-4 py-3 text-sm shadow-sm ${
                alert
                    ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-100'
                    : 'border-neutral-200 bg-white text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200'
            }`}
        >
            <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
            <div className="mt-2 text-lg font-semibold">{value}</div>
        </div>
    );
}

function InfoCard({
    title,
    icon,
    items,
}: {
    title: string;
    icon: ReactNode;
    items: Array<{ label: string; value: string }>;
}) {
    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <header className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
                    {icon}
                </div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">{title}</h3>
            </header>
            <div className="mt-4 grid grid-cols-3 gap-3">
                {items.map((item) => (
                    <div key={item.label} className="rounded-lg border border-neutral-200 px-3 py-2 text-center dark:border-neutral-800">
                        <div className="text-xs text-neutral-500">{item.label}</div>
                        <div className="mt-1 text-lg font-semibold">{item.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function formatRange(startIso: string, endIso: string) {
    const start = new Date(startIso);
    const end = new Date(endIso);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'This week';
    return `${start.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' })} – ${end.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' })}`;
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 2,
    }).format(value);
}

function formatDuration(minutes: number) {
    if (!minutes || Number.isNaN(minutes)) return '0h 0m';
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hrs}h ${mins}m`;
}

function formatHours(minutes: number) {
    if (!minutes || Number.isNaN(minutes)) return '0.00h';
    return `${(minutes / 60).toFixed(2)}h`;
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
