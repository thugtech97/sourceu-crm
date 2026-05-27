import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/users' },
    { title: 'Audit Log', href: '/admin/audit-log' },
];

type AuditEntry = {
    id: number;
    user: { name: string; email: string } | null;
    event: string;
    auditable_type: string;
    auditable_id: number;
    old_values: Record<string, unknown>;
    new_values: Record<string, unknown>;
    ip_address: string | null;
    created_at: string;
};

type PaginatedAudits = {
    data: AuditEntry[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

type Props = {
    audits: PaginatedAudits;
    filters: { search: string; event: string; model: string };
};

const EVENT_COLORS: Record<string, string> = {
    created: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    updated: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    deleted: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    restored: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
};

function DiffRow({ label, oldVal, newVal }: { label: string; oldVal: unknown; newVal: unknown }) {
    const fmt = (v: unknown) => (v === null || v === undefined || v === '' ? <span className="text-muted-foreground italic">—</span> : String(v));
    return (
        <tr className="border-b last:border-0">
            <td className="text-muted-foreground py-1 pr-3 font-mono text-xs">{label}</td>
            <td className="py-1 pr-3 font-mono text-xs text-red-600 line-through dark:text-red-400">{fmt(oldVal)}</td>
            <td className="py-1 font-mono text-xs text-green-700 dark:text-green-400">{fmt(newVal)}</td>
        </tr>
    );
}

function ChangesCell({ old_values, new_values, event }: Pick<AuditEntry, 'old_values' | 'new_values' | 'event'>) {
    const keys = event === 'created' ? Object.keys(new_values) : event === 'deleted' ? Object.keys(old_values) : Array.from(new Set([...Object.keys(old_values), ...Object.keys(new_values)]));

    if (keys.length === 0) {
        return <span className="text-muted-foreground text-xs italic">no changes recorded</span>;
    }

    return (
        <table className="w-full">
            <tbody>
                {keys.map((k) => (
                    <DiffRow key={k} label={k} oldVal={old_values[k]} newVal={new_values[k]} />
                ))}
            </tbody>
        </table>
    );
}

export default function AuditLog({ audits, filters }: Props) {
    const [search, setSearch] = useState(filters.search);
    const [event, setEvent] = useState(filters.event || 'all');
    const [model, setModel] = useState(filters.model || 'all');

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get(
                route('admin.audit-log'),
                {
                    search: search || undefined,
                    event: event === 'all' ? undefined : event,
                    model: model === 'all' ? undefined : model,
                },
                { preserveState: true, replace: true },
            );
        }, 400);
        return () => clearTimeout(timeout);
    }, [search, event, model]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Log" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Audit Log</h1>
                        <p className="text-muted-foreground text-sm">{audits.total.toLocaleString()} entries total</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Input
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-48"
                        />
                        <Select value={event} onValueChange={setEvent}>
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="Event" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All events</SelectItem>
                                <SelectItem value="created">Created</SelectItem>
                                <SelectItem value="updated">Updated</SelectItem>
                                <SelectItem value="deleted">Deleted</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={model} onValueChange={setModel}>
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="Model" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All models</SelectItem>
                                <SelectItem value="Contact">Contact</SelectItem>
                                <SelectItem value="Account">Account</SelectItem>
                                <SelectItem value="Deal">Deal</SelectItem>
                                <SelectItem value="DncList">DNC List</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="rounded-xl border">
                    {audits.data.length === 0 ? (
                        <div className="text-muted-foreground px-6 py-16 text-center text-sm">No audit entries found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">When</th>
                                        <th className="px-4 py-3 text-left font-medium">User</th>
                                        <th className="px-4 py-3 text-left font-medium">Event</th>
                                        <th className="px-4 py-3 text-left font-medium">Model</th>
                                        <th className="px-4 py-3 text-left font-medium">Changes</th>
                                        <th className="hidden px-4 py-3 text-left font-medium xl:table-cell">IP</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {audits.data.map((audit) => (
                                        <tr key={audit.id} className="hover:bg-muted/30 align-top">
                                            <td className="text-muted-foreground whitespace-nowrap px-4 py-3 text-xs">
                                                {formatDateTime(audit.created_at)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {audit.user ? (
                                                    <div>
                                                        <p className="font-medium">{audit.user.name}</p>
                                                        <p className="text-muted-foreground text-xs">{audit.user.email}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs italic">System</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${EVENT_COLORS[audit.event] ?? 'bg-muted text-muted-foreground'}`}>
                                                    {audit.event}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {audit.auditable_type} #{audit.auditable_id}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <ChangesCell
                                                    old_values={audit.old_values}
                                                    new_values={audit.new_values}
                                                    event={audit.event}
                                                />
                                            </td>
                                            <td className="text-muted-foreground hidden whitespace-nowrap px-4 py-3 font-mono text-xs xl:table-cell">
                                                {audit.ip_address ?? '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {audits.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm">
                        <p className="text-muted-foreground">
                            Page {audits.current_page} of {audits.last_page}
                        </p>
                        <div className="flex gap-2">
                            {audits.prev_page_url ? (
                                <Link href={audits.prev_page_url} className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
                                    <ChevronLeft className="size-4" /> Prev
                                </Link>
                            ) : (
                                <span className="text-muted-foreground inline-flex cursor-not-allowed items-center gap-1 rounded-md border px-3 py-1.5 opacity-50">
                                    <ChevronLeft className="size-4" /> Prev
                                </span>
                            )}
                            {audits.next_page_url ? (
                                <Link href={audits.next_page_url} className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
                                    Next <ChevronRight className="size-4" />
                                </Link>
                            ) : (
                                <span className="text-muted-foreground inline-flex cursor-not-allowed items-center gap-1 rounded-md border px-3 py-1.5 opacity-50">
                                    Next <ChevronRight className="size-4" />
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
