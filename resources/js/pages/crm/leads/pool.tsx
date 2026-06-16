import ConfirmDialog from '@/components/confirm-dialog';
import FlashAlert from '@/components/flash-alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { AlertTriangle, Clock, Phone, RefreshCw, UserCheck } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Lead Pool', href: '/leads/pool' }];

type PoolContact = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    source_type: string;
    disposition: string;
    pool_assigned_at: string | null;
    pool_expires_at: string | null;
    account?: { name: string } | null;
};

type PaginationLink = { url: string | null; label: string; active: boolean };

type Props = {
    pool: { data: PoolContact[]; links: PaginationLink[] };
    myLeads: { data: PoolContact[]; links: PaginationLink[] };
    team: string;
    teams: { value: string; label: string }[];
};

type DispositionOption = {
    value: string;
    label: string;
    color: string;
    needsReason?: boolean;
    needsAccountName?: boolean;
};

const INBOUND_DISPOSITIONS: DispositionOption[] = [
    { value: 'opportunity',       label: 'Convert to opportunity', color: 'text-green-700', needsAccountName: true },
    { value: 'meeting_booked',    label: 'Meeting booked',         color: 'text-blue-700' },
    { value: 'warm_email',        label: 'Warm email nurture',     color: 'text-orange-700' },
    { value: 'dnc',               label: 'Do Not Contact (DNC)',   color: 'text-red-700', needsReason: true },
];

const COLD_DISPOSITIONS: DispositionOption[] = [
    { value: 'handoff_to_sales',  label: 'Hand off to sales',      color: 'text-green-700' },
    { value: 'meeting_booked',    label: 'Meeting booked',         color: 'text-blue-700' },
    { value: 'warm_email',        label: 'Warm email nurture',     color: 'text-orange-700' },
    { value: 'dnc',               label: 'Do Not Contact (DNC)',   color: 'text-red-700', needsReason: true },
];

const DISPOSITION_BADGE: Record<string, string> = {
    new_lead: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    recycled: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
};

function timeLeft(expiresAt: string | null): { label: string; urgent: boolean } {
    if (!expiresAt) return { label: '', urgent: false };
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return { label: 'Expired', urgent: true };
    const hours = Math.floor(diff / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000) / 60_000);
    return { label: `${hours}h ${minutes}m`, urgent: hours < 6 };
}

function initials(name: string): string {
    return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
}

function DispositionDialog({ contact, team, open, onClose }: { contact: PoolContact; team: string; open: boolean; onClose: () => void }) {
    const options = team === 'cold_calling' ? COLD_DISPOSITIONS : INBOUND_DISPOSITIONS;
    const { data, setData, patch, processing } = useForm({ disposition: '', reason: '', account_name: '' });
    const selected = options.find((o) => o.value === data.disposition);

    const isValid = data.disposition &&
        (!selected?.needsAccountName || data.account_name.trim()) &&
        !processing;

    function submit() {
        patch(`/leads/pool/${contact.id}/disposition`, { onSuccess: onClose });
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Set outcome — {contact.name}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                    <Select value={data.disposition} onValueChange={(v) => setData('disposition', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Choose outcome…" />
                        </SelectTrigger>
                        <SelectContent>
                            {options.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                    <span className={o.color}>{o.label}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {selected?.needsAccountName && (
                        <div className="grid gap-1.5">
                            <label className="text-sm font-medium">Company / Account name</label>
                            <input
                                className="border-input placeholder:text-muted-foreground flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
                                placeholder="e.g. Acme Corp"
                                value={data.account_name}
                                onChange={(e) => setData('account_name', e.target.value)}
                                autoFocus
                            />
                        </div>
                    )}
                    {selected?.needsReason && (
                        <input
                            className="border-input placeholder:text-muted-foreground flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
                            placeholder="Reason for DNC…"
                            value={data.reason}
                            onChange={(e) => setData('reason', e.target.value)}
                        />
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button disabled={!isValid} onClick={submit}>
                        {selected?.needsAccountName ? 'Convert to opportunity' : 'Confirm'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function PoolRow({ contact }: { contact: PoolContact }) {
    const [claiming, setClaiming] = useState(false);

    function claim() {
        setClaiming(true);
        router.post(`/leads/pool/${contact.id}/claim`, {}, {
            preserveScroll: true,
            preserveState: false,
            onFinish: () => setClaiming(false),
        });
    }

    return (
        <tr className="hover:bg-muted/30 transition-colors">
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                        {initials(contact.name)}
                    </div>
                    <div className="min-w-0">
                        <Link href={`/contacts/${contact.id}/edit`} className="font-medium hover:underline">
                            {contact.name}
                        </Link>
                        {contact.account?.name && <p className="text-muted-foreground text-xs">{contact.account.name}</p>}
                    </div>
                </div>
            </td>
            <td className="hidden px-4 py-3 md:table-cell">
                {contact.email
                    ? <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline dark:text-blue-400 text-sm">{contact.email}</a>
                    : <span className="text-muted-foreground">—</span>}
            </td>
            <td className="hidden px-4 py-3 md:table-cell">
                {contact.phone
                    ? <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline dark:text-blue-400 text-sm">{contact.phone}</a>
                    : <span className="text-muted-foreground">—</span>}
            </td>
            <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${DISPOSITION_BADGE[contact.disposition] ?? 'bg-muted text-muted-foreground'}`}>
                    {contact.disposition === 'recycled' ? 'Recycled' : 'New'}
                </span>
            </td>
            <td className="px-4 py-3 text-right">
                <Button size="sm" disabled={claiming} onClick={claim} className="min-w-16">
                    {claiming ? 'Claiming…' : 'Claim'}
                </Button>
            </td>
        </tr>
    );
}

function MyLeadRow({ contact, team }: { contact: PoolContact; team: string }) {
    const [dispositionOpen, setDispositionOpen] = useState(false);
    const [releaseOpen, setReleaseOpen] = useState(false);
    const [dialing, setDialing] = useState(false);
    const timer = timeLeft(contact.pool_expires_at);

    function release() {
        router.patch(`/leads/pool/${contact.id}/release`, {}, { preserveScroll: true, onFinish: () => setReleaseOpen(false) });
    }

    function dialContact() {
        setDialing(true);
        router.post(`/contacts/${contact.id}/dialpad/dial`, {}, {
            preserveScroll: true,
            onFinish: () => setDialing(false),
        });
    }

    return (
        <>
            <tr className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                            {initials(contact.name)}
                        </div>
                        <div className="min-w-0">
                            <Link href={`/contacts/${contact.id}/edit`} className="font-medium hover:underline">
                                {contact.name}
                            </Link>
                            {contact.account?.name && <p className="text-muted-foreground text-xs">{contact.account.name}</p>}
                        </div>
                    </div>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                    {contact.phone
                        ? <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline dark:text-blue-400 text-sm">{contact.phone}</a>
                        : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3">
                    {timer.label && (
                        <span className={`flex items-center gap-1 text-xs font-medium ${timer.urgent ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {timer.urgent ? <AlertTriangle className="size-3" /> : <Clock className="size-3" />}
                            {timer.label}
                        </span>
                    )}
                </td>
                <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                        <Button size="sm" onClick={() => setDispositionOpen(true)}>
                            <UserCheck className="mr-1.5 size-3.5" />
                            Set outcome
                        </Button>
                        {contact.phone && (
                            <Button size="sm" variant="outline" disabled={dialing} onClick={dialContact} title="Call with Dialpad">
                                <Phone className="size-3.5" />
                            </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setReleaseOpen(true)} title="Release to pool">
                            <RefreshCw className="size-3.5" />
                        </Button>
                    </div>
                </td>
            </tr>
            <DispositionDialog contact={contact} team={team} open={dispositionOpen} onClose={() => setDispositionOpen(false)} />
            <ConfirmDialog
                open={releaseOpen}
                onClose={() => setReleaseOpen(false)}
                onConfirm={release}
                title="Release lead to pool?"
                description={`${contact.name} will return to the shared pool and can be claimed by any rep.`}
                confirmLabel="Release"
                variant="default"
            />
        </>
    );
}

export default function LeadPool({ pool, myLeads, team, teams }: Props) {
    const [activeTab, setActiveTab] = useState<'pool' | 'mine'>('pool');

    function switchTeam(newTeam: string) {
        router.get('/leads/pool', { team: newTeam }, { preserveState: false });
    }

    const currentTeam = teams.find((t) => t.value === team);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Lead Pool" />

            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Lead Pool</h1>
                        <p className="text-muted-foreground text-sm">
                            {currentTeam?.label} — first to dial claims the lead.
                        </p>
                    </div>
                    <Select value={team} onValueChange={switchTeam}>
                        <SelectTrigger className="w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {teams.map((t) => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <FlashAlert />

                {/* Summary strip */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="bg-card rounded-xl border p-4 shadow-xs">
                        <p className="text-muted-foreground text-xs">Unclaimed</p>
                        <p className="text-2xl font-bold">{pool.data.length}</p>
                    </div>
                    <div className="bg-card rounded-xl border p-4 shadow-xs">
                        <p className="text-muted-foreground text-xs">My active leads</p>
                        <p className="text-2xl font-bold">{myLeads.data.length}</p>
                    </div>
                    <div className="bg-card rounded-xl border p-4 shadow-xs">
                        <p className="text-muted-foreground text-xs">Expiring soon (&lt;6h)</p>
                        <p className="text-2xl font-bold text-red-600">
                            {myLeads.data.filter((c) => {
                                if (!c.pool_expires_at) return false;
                                return new Date(c.pool_expires_at).getTime() - Date.now() < 6 * 3_600_000;
                            }).length}
                        </p>
                    </div>
                    <div className="bg-card rounded-xl border p-4 shadow-xs">
                        <p className="text-muted-foreground text-xs">Recycled leads</p>
                        <p className="text-2xl font-bold">
                            {pool.data.filter((c) => c.disposition === 'recycled').length}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 rounded-lg border p-1 w-fit bg-muted/40">
                    {(['pool', 'mine'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === tab ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            {tab === 'pool' ? 'Pool' : 'My Leads'}
                            {tab === 'pool' && pool.data.length > 0 && (
                                <span className="ml-2 rounded-full bg-primary/15 px-1.5 py-0.5 text-xs text-primary">{pool.data.length}</span>
                            )}
                            {tab === 'mine' && myLeads.data.length > 0 && (
                                <span className="ml-2 rounded-full bg-primary/15 px-1.5 py-0.5 text-xs text-primary">{myLeads.data.length}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Pool tab */}
                {activeTab === 'pool' && (
                    <>
                        <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-muted/50 border-b text-left">
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</th>
                                        <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:table-cell">Email</th>
                                        <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:table-cell">Phone</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {pool.data.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-muted-foreground px-4 py-12 text-center">
                                                No unclaimed leads right now — check back later.
                                            </td>
                                        </tr>
                                    )}
                                    {pool.data.map((contact) => <PoolRow key={contact.id} contact={contact} />)}
                                </tbody>
                            </table>
                        </div>
                        <PaginationBar links={pool.links} />
                    </>
                )}

                {/* My Leads tab */}
                {activeTab === 'mine' && (
                    <>
                        <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-muted/50 border-b text-left">
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</th>
                                        <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:table-cell">Phone</th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Expires</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {myLeads.data.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="text-muted-foreground px-4 py-12 text-center">
                                                You have no active leads. Claim some from the Pool tab.
                                            </td>
                                        </tr>
                                    )}
                                    {myLeads.data.map((contact) => <MyLeadRow key={contact.id} contact={contact} team={team} />)}
                                </tbody>
                            </table>
                        </div>
                        <PaginationBar links={myLeads.links} />
                    </>
                )}
            </div>
        </AppLayout>
    );
}

function PaginationBar({ links }: { links: PaginationLink[] }) {
    return (
        <div className="flex flex-wrap gap-2">
            {links.map((link) => (
                <Button key={link.label} asChild={Boolean(link.url)} disabled={!link.url} variant={link.active ? 'default' : 'outline'} size="sm">
                    {link.url
                        ? <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
                        : <span dangerouslySetInnerHTML={{ __html: link.label }} />}
                </Button>
            ))}
        </div>
    );
}
