import ConfirmDialog from '@/components/confirm-dialog';
import FlashAlert from '@/components/flash-alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Leads', href: '/leads' }];

const ICP_TIER_STYLES: Record<string, string> = {
    a: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    b: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    c: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    d: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const STATUS_STYLES: Record<string, string> = {
    new: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
    contacted: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    working: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    nurturing: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    qualified: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    disqualified: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    converted: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const PRIORITY_STYLES: Record<string, string> = {
    hot: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    warm: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    cold: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

type Lead = {
    id: string;
    first_name: string;
    last_name: string;
    name: string;
    email: string;
    phone: string | null;
    company_name: string | null;
    status: string;
    priority: string;
    icp_tier: string | null;
    icp_score: number | null;
    source_type: string;
    last_activity_at: string | null;
    follow_up_due_at: string | null;
    assigned_to?: { id: number; name: string } | null;
};

type PaginationLink = { url: string | null; label: string; active: boolean };

type SalesRep = { id: number; name: string };

type Props = {
    leads: { data: Lead[]; links: PaginationLink[] };
    filters: { search: string; status: string; priority: string; assigned_to: string };
    salesReps: SalesRep[];
};

function formatDate(dateString: string | null): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function initials(name: string): string {
    return name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export default function LeadsIndex({ leads, filters, salesReps }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [priority, setPriority] = useState(filters.priority ?? '');
    const [assignedTo, setAssignedTo] = useState(filters.assigned_to ?? '');
    const [deleting, setDeleting] = useState<Lead | null>(null);

    function submit(event: FormEvent) {
        event.preventDefault();
        router.get('/leads', { search, status, priority, assigned_to: assignedTo }, { preserveState: true, replace: true });
    }

    function confirmDelete() {
        if (!deleting) return;
        router.delete(`/leads/${deleting.id}`, { onFinish: () => setDeleting(null) });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leads" />

            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Leads</h1>
                        <p className="text-muted-foreground text-sm">Track and qualify your inbound leads.</p>
                    </div>
                    <Button asChild size="sm">
                        <Link href="/leads/create">+ New lead</Link>
                    </Button>
                </div>

                <form onSubmit={submit} className="flex flex-wrap gap-2">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, email or company…"
                        className="h-9 max-w-xs"
                    />
                    <select
                        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    >
                        <option value="">All statuses</option>
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="working">Working</option>
                        <option value="nurturing">Nurturing</option>
                        <option value="qualified">Qualified</option>
                        <option value="disqualified">Disqualified</option>
                        <option value="converted">Converted</option>
                    </select>
                    <select
                        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                    >
                        <option value="">All priorities</option>
                        <option value="hot">Hot</option>
                        <option value="warm">Warm</option>
                        <option value="cold">Cold</option>
                    </select>
                    <select
                        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                    >
                        <option value="">All reps</option>
                        {salesReps.map((rep) => (
                            <option key={rep.id} value={String(rep.id)}>
                                {rep.name}
                            </option>
                        ))}
                    </select>
                    <Button type="submit" variant="outline" size="sm">
                        Filter
                    </Button>
                </form>

                <FlashAlert />

                <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/50 border-b text-left">
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lead</th>
                                <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:table-cell">Company</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                                <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:table-cell">Priority</th>
                                <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground xl:table-cell">ICP</th>
                                <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground xl:table-cell">Assigned</th>
                                <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground xl:table-cell">Follow-up</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {leads.data.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-muted-foreground px-4 py-12 text-center">
                                        No leads found.
                                    </td>
                                </tr>
                            )}
                            {leads.data.map((lead) => (
                                <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                                                {initials(lead.name)}
                                            </div>
                                            <div className="min-w-0">
                                                <Link href={`/leads/${lead.id}`} className="font-medium hover:underline">
                                                    {lead.name}
                                                </Link>
                                                <p className="text-muted-foreground truncate text-xs">{lead.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden px-4 py-3 md:table-cell">
                                        <span className="text-muted-foreground">{lead.company_name ?? '—'}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[lead.status] ?? 'bg-muted text-muted-foreground'}`}
                                        >
                                            {lead.status}
                                        </span>
                                    </td>
                                    <td className="hidden px-4 py-3 lg:table-cell">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${PRIORITY_STYLES[lead.priority] ?? 'bg-muted text-muted-foreground'}`}
                                        >
                                            {lead.priority}
                                        </span>
                                    </td>
                                    <td className="hidden px-4 py-3 xl:table-cell">
                                        {lead.icp_tier ? (
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${ICP_TIER_STYLES[lead.icp_tier] ?? 'bg-muted text-muted-foreground'}`}
                                            >
                                                {lead.icp_tier}
                                                {lead.icp_score !== null && (
                                                    <span className="ml-1 opacity-70">· {lead.icp_score}</span>
                                                )}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </td>
                                    <td className="hidden px-4 py-3 xl:table-cell">
                                        <span className="text-muted-foreground text-xs">
                                            {lead.assigned_to?.name ?? 'Unassigned'}
                                        </span>
                                    </td>
                                    <td className="hidden px-4 py-3 xl:table-cell">
                                        <span className="text-muted-foreground text-xs">
                                            {formatDate(lead.follow_up_due_at)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <TooltipProvider delayDuration={0}>
                                            <div className="flex justify-end gap-1">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={`/leads/${lead.id}`}>
                                                                <Eye className="size-4" />
                                                            </Link>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>View</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={`/leads/${lead.id}/edit`}>
                                                                <Pencil className="size-4" />
                                                            </Link>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Edit</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="sm" onClick={() => setDeleting(lead)}>
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Delete</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </TooltipProvider>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap gap-2">
                    {leads.links.map((link) => (
                        <Button
                            key={link.label}
                            asChild={Boolean(link.url)}
                            disabled={!link.url}
                            variant={link.active ? 'default' : 'outline'}
                            size="sm"
                        >
                            {link.url ? (
                                <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
                            ) : (
                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                            )}
                        </Button>
                    ))}
                </div>
            </div>

            <ConfirmDialog
                open={Boolean(deleting)}
                onClose={() => setDeleting(null)}
                onConfirm={confirmDelete}
                title={`Delete ${deleting?.name}?`}
                description="This lead will be soft-deleted and can be recovered later."
                confirmLabel="Delete lead"
            />
        </AppLayout>
    );
}
