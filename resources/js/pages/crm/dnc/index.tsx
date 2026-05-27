import ConfirmDialog from '@/components/confirm-dialog';
import FlashAlert from '@/components/flash-alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Ban } from 'lucide-react';
import { FormEvent, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'DNC List', href: '/dnc' }];

type DncEntry = {
    id: number;
    phone: string | null;
    email: string | null;
    reason: string | null;
    created_at: string;
    added_by?: { name: string } | null;
    contact?: { id: number; first_name: string; last_name: string } | null;
};

type PaginationLink = { url: string | null; label: string; active: boolean };

type Props = {
    entries: { data: DncEntry[]; links: PaginationLink[] };
    filters: { search: string };
    total: number;
};

export default function DncIndex({ entries, filters, total }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [removing, setRemoving] = useState<DncEntry | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        phone: '',
        email: '',
        reason: '',
    });

    function submitSearch(e: FormEvent) {
        e.preventDefault();
        router.get('/dnc', { search }, { preserveState: true, replace: true });
    }

    function submitAdd(e: FormEvent) {
        e.preventDefault();
        post('/dnc', { onSuccess: () => reset() });
    }

    function confirmRemove() {
        if (!removing) return;
        router.delete(`/dnc/${removing.id}`, { onFinish: () => setRemoving(null) });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="DNC List" />

            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Do Not Contact List</h1>
                        <p className="text-muted-foreground text-sm">
                            {total} blocked {total === 1 ? 'entry' : 'entries'} — leads matching these phone numbers or emails are rejected at ingestion.
                        </p>
                    </div>
                </div>

                <FlashAlert />

                {/* Add entry form */}
                <div className="bg-card rounded-xl border p-4 shadow-xs">
                    <h2 className="mb-3 text-sm font-semibold">Add to DNC list</h2>
                    <form onSubmit={submitAdd} className="grid gap-3 sm:grid-cols-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="dnc-phone" className="text-xs">Phone</Label>
                            <Input
                                id="dnc-phone"
                                placeholder="+1 555 000 0000"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                className="h-9"
                            />
                            {errors.phone && <p className="text-destructive text-xs">{errors.phone}</p>}
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="dnc-email" className="text-xs">Email</Label>
                            <Input
                                id="dnc-email"
                                type="email"
                                placeholder="name@example.com"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="h-9"
                            />
                        </div>
                        <div className="grid gap-1.5 sm:col-span-1">
                            <Label htmlFor="dnc-reason" className="text-xs">Reason (optional)</Label>
                            <Input
                                id="dnc-reason"
                                placeholder="e.g. Requested removal"
                                value={data.reason}
                                onChange={(e) => setData('reason', e.target.value)}
                                className="h-9"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                                <Ban className="mr-1.5 size-4" />
                                Add entry
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Search */}
                <form onSubmit={submitSearch} className="flex max-w-sm gap-2">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by phone or email…"
                        className="h-9"
                    />
                    <Button type="submit" variant="outline" size="sm">Search</Button>
                </form>

                {/* Table */}
                <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/50 border-b text-left">
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</th>
                                <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:table-cell">Contact</th>
                                <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:table-cell">Reason</th>
                                <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:table-cell">Added by</th>
                                <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground xl:table-cell">Date</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {entries.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-muted-foreground px-4 py-12 text-center">
                                        No DNC entries found.
                                    </td>
                                </tr>
                            )}
                            {entries.data.map((entry) => (
                                <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs">
                                        {entry.phone ?? <span className="text-muted-foreground">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                        {entry.email ?? <span className="text-muted-foreground">—</span>}
                                    </td>
                                    <td className="hidden px-4 py-3 md:table-cell">
                                        {entry.contact ? (
                                            <Link
                                                href={`/contacts/${entry.contact.id}/edit`}
                                                className="text-blue-600 hover:underline dark:text-blue-400 text-xs"
                                            >
                                                {entry.contact.first_name} {entry.contact.last_name}
                                            </Link>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </td>
                                    <td className="hidden px-4 py-3 lg:table-cell">
                                        <span className="text-muted-foreground text-xs">{entry.reason ?? '—'}</span>
                                    </td>
                                    <td className="hidden px-4 py-3 lg:table-cell">
                                        <span className="text-muted-foreground text-xs">{entry.added_by?.name ?? '—'}</span>
                                    </td>
                                    <td className="hidden px-4 py-3 xl:table-cell">
                                        <span className="text-muted-foreground text-xs">{formatDate(entry.created_at)}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setRemoving(entry)}>
                                            Remove
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-wrap gap-2">
                    {entries.links.map((link) => (
                        <Button key={link.label} asChild={Boolean(link.url)} disabled={!link.url} variant={link.active ? 'default' : 'outline'} size="sm">
                            {link.url
                                ? <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
                                : <span dangerouslySetInnerHTML={{ __html: link.label }} />}
                        </Button>
                    ))}
                </div>
            </div>

            <ConfirmDialog
                open={Boolean(removing)}
                onClose={() => setRemoving(null)}
                onConfirm={confirmRemove}
                title="Remove from DNC list?"
                description={`${removing?.phone ?? removing?.email} will be unblocked and can receive leads again.`}
                confirmLabel="Remove"
                variant="default"
            />
        </AppLayout>
    );
}
