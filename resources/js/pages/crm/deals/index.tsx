import ConfirmDialog from '@/components/confirm-dialog';
import FlashAlert from '@/components/flash-alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Kanban, Pencil, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Deals', href: '/deals' }];

const STAGE_STYLES: Record<string, string> = {
    new:               'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    meeting_booked:    'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    qualified:         'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    proposal:          'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    won:               'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    warm_email_nurture:'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    dnc:               'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    lost:              'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500',
};

type Deal = {
    id: number;
    name: string;
    stage: string;
    value: string;
    probability: number;
    expected_close_date: string | null;
    account?: { name: string } | null;
    contact?: { name: string } | null;
};

type PaginationLink = { url: string | null; label: string; active: boolean };

type Props = {
    deals: { data: Deal[]; links: PaginationLink[] };
    filters: { search: string };
};

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function stageLabel(value: string) {
    return value.replaceAll('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function probColor(p: number): string {
    if (p >= 70) return 'bg-green-500';
    if (p >= 40) return 'bg-amber-500';
    return 'bg-slate-400';
}

export default function DealsIndex({ deals, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [deleting, setDeleting] = useState<Deal | null>(null);

    function submit(event: FormEvent) {
        event.preventDefault();
        router.get('/deals', { search }, { preserveState: true, replace: true });
    }

    function confirmDelete() {
        if (!deleting) return;
        router.delete(`/deals/${deleting.id}`, { onFinish: () => setDeleting(null) });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Deals" />

            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Deals</h1>
                        <p className="text-muted-foreground text-sm">Track sales opportunities from first touch to close.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm">
                            <Link href="/deals/kanban">
                                <Kanban className="mr-1.5 size-4" />
                                Kanban
                            </Link>
                        </Button>
                        <Button asChild size="sm">
                            <Link href="/deals/create">+ New deal</Link>
                        </Button>
                    </div>
                </div>

                <form onSubmit={submit} className="flex max-w-sm gap-2">
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search deals…" className="h-9" />
                    <Button type="submit" variant="outline" size="sm">Search</Button>
                </form>

                <FlashAlert />

                <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/50 border-b text-left">
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Deal</th>
                                <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:table-cell">Account</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Stage</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Value</th>
                                <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:table-cell">Close date</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {deals.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-muted-foreground px-4 py-12 text-center">
                                        No deals found.
                                    </td>
                                </tr>
                            )}
                            {deals.data.map((deal) => (
                                <tr key={deal.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <Link href={`/deals/${deal.id}/edit`} className="font-medium hover:underline">
                                            {deal.name}
                                        </Link>
                                        {deal.contact?.name && (
                                            <p className="text-muted-foreground text-xs">{deal.contact.name}</p>
                                        )}
                                    </td>
                                    <td className="hidden px-4 py-3 md:table-cell">
                                        <span className="text-muted-foreground">{deal.account?.name ?? '—'}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_STYLES[deal.stage] ?? 'bg-muted text-muted-foreground'}`}>
                                            {stageLabel(deal.stage)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-semibold">{money.format(Number(deal.value))}</p>
                                        <div className="mt-1 flex items-center gap-1.5">
                                            <div className="bg-muted h-1 w-14 rounded-full overflow-hidden">
                                                <div className={`h-1 rounded-full ${probColor(deal.probability)}`} style={{ width: `${deal.probability}%` }} />
                                            </div>
                                            <span className="text-muted-foreground text-xs">{deal.probability}%</span>
                                        </div>
                                    </td>
                                    <td className="hidden px-4 py-3 lg:table-cell">
                                        <span className="text-muted-foreground">{deal.expected_close_date ?? '—'}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <TooltipProvider delayDuration={0}>
                                            <div className="flex justify-end gap-1">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={`/deals/${deal.id}/edit`}>
                                                                <Pencil className="size-4" />
                                                            </Link>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Edit</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="sm" onClick={() => setDeleting(deal)}>
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
                    {deals.links.map((link) => (
                        <Button key={link.label} asChild={Boolean(link.url)} disabled={!link.url} variant={link.active ? 'default' : 'outline'} size="sm">
                            {link.url
                                ? <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
                                : <span dangerouslySetInnerHTML={{ __html: link.label }} />}
                        </Button>
                    ))}
                </div>
            </div>

            <ConfirmDialog
                open={Boolean(deleting)}
                onClose={() => setDeleting(null)}
                onConfirm={confirmDelete}
                title={`Delete ${deleting?.name}?`}
                description="This deal will be permanently deleted and cannot be recovered."
                confirmLabel="Delete deal"
            />
        </AppLayout>
    );
}
