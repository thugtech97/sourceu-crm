import ConfirmDialog from '@/components/confirm-dialog';
import FlashAlert from '@/components/flash-alert';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowUpRight,
    BriefcaseBusiness,
    Building2,
    Mail,
    Pencil,
    Phone,
    Trash2,
    UserCircle,
} from 'lucide-react';
import { useState } from 'react';

type Account = { id: number; name: string; industry: string | null; website: string | null };
type Deal = {
    id: number; name: string; stage: string; value: string;
    expected_close_date: string | null; probability: number;
};
type CallLog = {
    id: number; direction: string; status: string;
    duration_seconds: number | null; started_at: string | null;
};
type Contact = {
    id: number; name: string; first_name: string; last_name: string;
    email: string | null; phone: string | null; job_title: string | null;
    company_name: string | null; industry: string | null; source_type: string | null;
    status: string; notes: string | null; created_at: string;
    account?: Account | null;
    deals: Deal[];
    call_logs: CallLog[];
};

type Props = { contact: Contact };

const STATUS_STYLES: Record<string, string> = {
    lead: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    prospect: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    customer: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    inactive: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};
const STAGE_STYLES: Record<string, string> = {
    new: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    meeting_booked: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    qualified: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    proposal: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    won: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    warm_email_nurture: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    dnc: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    lost: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500',
};

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
function stageLabel(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }
function initials(name: string) { return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase(); }
function formatDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatDuration(s: number | null) {
    if (!s) return '—';
    const m = Math.floor(s / 60), sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function DL({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 text-sm">{value ?? <span className="text-muted-foreground">—</span>}</dd>
        </div>
    );
}

export default function ShowContact({ contact }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Contacts', href: '/contacts' },
        { title: contact.name, href: `/contacts/${contact.id}` },
    ];
    const [showDelete, setShowDelete] = useState(false);

    const openDeals = contact.deals.filter((d) => !['won', 'lost', 'dnc'].includes(d.stage));
    const totalValue = contact.deals.reduce((s, d) => s + Number(d.value), 0);
    const wonValue = contact.deals.filter((d) => d.stage === 'won').reduce((s, d) => s + Number(d.value), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={contact.name} />

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <FlashAlert />

                {/* Header */}
                <div className="bg-card rounded-xl border p-6 shadow-xs">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-xl font-bold text-white shadow">
                                {initials(contact.name)}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{contact.name}</h1>
                                <p className="text-muted-foreground mt-0.5 text-sm">
                                    {[contact.job_title, contact.company_name].filter(Boolean).join(' · ') || 'No title'}
                                </p>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[contact.status] ?? 'bg-muted text-muted-foreground'}`}>
                                        {contact.status}
                                    </span>
                                    {contact.source_type && (
                                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                                            {contact.source_type}
                                        </span>
                                    )}
                                    {contact.account && (
                                        <Link
                                            href={`/accounts/${contact.account.id}`}
                                            className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
                                        >
                                            <Building2 className="size-3" />
                                            {contact.account.name}
                                        </Link>
                                    )}
                                </div>
                                <div className="mt-2.5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                    {contact.email && (
                                        <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 hover:text-foreground">
                                            <Mail className="size-3.5" />{contact.email}
                                        </a>
                                    )}
                                    {contact.phone && (
                                        <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 hover:text-foreground">
                                            <Phone className="size-3.5" />{contact.phone}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/contacts/${contact.id}/edit`}>
                                    <Pencil className="mr-1 size-3.5" />Edit
                                </Link>
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)}>
                                <Trash2 className="mr-1 size-3.5" />Delete
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="grid gap-5 lg:grid-cols-3">
                    {/* Left: details + opportunities */}
                    <div className="space-y-5 lg:col-span-2">
                        {/* Contact details */}
                        <section className="bg-card rounded-xl border p-5 shadow-xs">
                            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                                <UserCircle className="size-4 text-muted-foreground" />
                                Contact details
                            </h2>
                            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                                <DL label="Email" value={contact.email ? <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline dark:text-blue-400">{contact.email}</a> : null} />
                                <DL label="Phone" value={contact.phone ? <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline dark:text-blue-400">{contact.phone}</a> : null} />
                                <DL label="Job title" value={contact.job_title} />
                                <DL label="Company" value={contact.company_name} />
                                <DL label="Source" value={contact.source_type ? <span className="capitalize">{contact.source_type}</span> : null} />
                                <DL label="Created" value={formatDate(contact.created_at)} />
                            </dl>
                            {contact.notes && (
                                <div className="mt-4 border-t pt-4">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Notes</p>
                                    <p className="mt-1.5 text-sm leading-relaxed">{contact.notes}</p>
                                </div>
                            )}
                        </section>

                        {/* Opportunities */}
                        <section className="bg-card rounded-xl border shadow-xs">
                            <div className="flex items-center justify-between border-b px-5 py-3.5">
                                <h2 className="flex items-center gap-2 text-sm font-semibold">
                                    <BriefcaseBusiness className="size-4 text-muted-foreground" />
                                    Opportunities
                                    {contact.deals.length > 0 && (
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{contact.deals.length}</span>
                                    )}
                                </h2>
                                <Button asChild variant="ghost" size="sm">
                                    <Link href="/deals/create">+ New</Link>
                                </Button>
                            </div>
                            {contact.deals.length === 0 ? (
                                <p className="text-muted-foreground px-5 py-8 text-center text-sm">No opportunities yet.</p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30 text-left">
                                            <th className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</th>
                                            <th className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Stage</th>
                                            <th className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Value</th>
                                            <th className="hidden px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:table-cell">Close date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {contact.deals.map((deal) => (
                                            <tr
                                                key={deal.id}
                                                className="cursor-pointer transition-colors hover:bg-muted/30"
                                                onClick={() => router.visit(`/deals/${deal.id}`)}
                                            >
                                                <td className="px-5 py-3 font-medium">{deal.name}</td>
                                                <td className="px-5 py-3">
                                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_STYLES[deal.stage] ?? 'bg-muted text-muted-foreground'}`}>
                                                        {stageLabel(deal.stage)}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 font-semibold">{money.format(Number(deal.value))}</td>
                                                <td className="hidden px-5 py-3 text-muted-foreground sm:table-cell">{formatDate(deal.expected_close_date)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </section>

                        {/* Recent calls */}
                        {contact.call_logs.length > 0 && (
                            <section className="bg-card rounded-xl border shadow-xs">
                                <div className="border-b px-5 py-3.5">
                                    <h2 className="flex items-center gap-2 text-sm font-semibold">
                                        <Phone className="size-4 text-muted-foreground" />
                                        Recent calls
                                    </h2>
                                </div>
                                <div className="divide-y">
                                    {contact.call_logs.map((log) => (
                                        <div key={log.id} className="flex items-center gap-3 px-5 py-3">
                                            <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${log.status === 'connected' || log.status === 'ended' ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'}`}>
                                                <Phone className="size-3.5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm capitalize">{log.direction} · {log.status}</p>
                                                <p className="text-xs text-muted-foreground">{formatDate(log.started_at)}</p>
                                            </div>
                                            <span className="text-sm text-muted-foreground">{formatDuration(log.duration_seconds)}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right sidebar */}
                    <div className="space-y-5">
                        {/* Linked account */}
                        <section className="bg-card rounded-xl border p-5 shadow-xs">
                            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                                <Building2 className="size-4 text-muted-foreground" />
                                Account
                            </h2>
                            {contact.account ? (
                                <Link
                                    href={`/accounts/${contact.account.id}`}
                                    className="group -mx-2 flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/60"
                                >
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                        {contact.account.name[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium group-hover:underline">{contact.account.name}</p>
                                        {contact.account.industry && <p className="text-xs text-muted-foreground">{contact.account.industry}</p>}
                                        {contact.account.website && <p className="text-xs text-muted-foreground">{contact.account.website.replace(/^https?:\/\//, '')}</p>}
                                    </div>
                                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                </Link>
                            ) : (
                                <div>
                                    <p className="text-xs text-muted-foreground">No account linked.</p>
                                    <Button asChild variant="outline" size="sm" className="mt-2 w-full">
                                        <Link href={`/contacts/${contact.id}/edit`}>Link account</Link>
                                    </Button>
                                </div>
                            )}
                        </section>

                        {/* Pipeline stats */}
                        <section className="bg-card rounded-xl border p-5 shadow-xs">
                            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pipeline</h2>
                            <dl className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <dt className="text-xs text-muted-foreground">Open opportunities</dt>
                                    <dd className="text-sm font-semibold">{openDeals.length}</dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt className="text-xs text-muted-foreground">Total value</dt>
                                    <dd className="text-sm font-semibold">{money.format(totalValue)}</dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt className="text-xs text-muted-foreground">Won</dt>
                                    <dd className="text-sm font-semibold text-green-600">{money.format(wonValue)}</dd>
                                </div>
                            </dl>
                        </section>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={showDelete}
                onClose={() => setShowDelete(false)}
                onConfirm={() => router.delete(`/contacts/${contact.id}`, { onSuccess: () => router.visit('/contacts') })}
                title={`Delete ${contact.name}?`}
                description="This contact will be permanently deleted and cannot be recovered."
                confirmLabel="Delete contact"
            />
        </AppLayout>
    );
}
