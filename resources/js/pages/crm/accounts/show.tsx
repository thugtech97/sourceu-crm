import ConfirmDialog from '@/components/confirm-dialog';
import FlashAlert from '@/components/flash-alert';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    Building2,
    Globe,
    Mail,
    Pencil,
    Phone,
    Trash2,
    Users,
} from 'lucide-react';
import { useState } from 'react';

type Contact = {
    id: number; first_name: string; last_name: string;
    email: string | null; phone: string | null; job_title: string | null; status: string;
};
type Deal = {
    id: number; name: string; stage: string; value: string;
    expected_close_date: string | null; probability: number;
};
type Account = {
    id: number; name: string; industry: string | null;
    website: string | null; phone: string | null; notes: string | null;
    created_at: string;
    contacts: Contact[];
    deals: Deal[];
};

type Props = { account: Account };

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
function contactName(c: Contact) { return `${c.first_name} ${c.last_name}`.trim(); }
function formatDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}
function initials(name: string) { return name.slice(0, 2).toUpperCase(); }

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
    return (
        <div className="bg-card flex flex-col gap-1 rounded-xl border p-4 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
    );
}

export default function ShowAccount({ account }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Accounts', href: '/accounts' },
        { title: account.name, href: `/accounts/${account.id}` },
    ];
    const [showDelete, setShowDelete] = useState(false);

    const openDeals = account.deals.filter((d) => !['won', 'lost', 'dnc'].includes(d.stage));
    const pipelineValue = openDeals.reduce((s, d) => s + Number(d.value), 0);
    const wonValue = account.deals.filter((d) => d.stage === 'won').reduce((s, d) => s + Number(d.value), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={account.name} />

            <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
                <FlashAlert />

                {/* Header */}
                <div className="bg-card rounded-xl border p-6 shadow-xs">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white shadow">
                                {initials(account.name)}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{account.name}</h1>
                                <p className="text-muted-foreground mt-0.5 text-sm">
                                    {account.industry ?? 'No industry set'}
                                </p>
                                <div className="mt-2.5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                    {account.phone && (
                                        <a href={`tel:${account.phone}`} className="flex items-center gap-1.5 hover:text-foreground">
                                            <Phone className="size-3.5" />{account.phone}
                                        </a>
                                    )}
                                    {account.website && (
                                        <a href={account.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground">
                                            <Globe className="size-3.5" />{account.website.replace(/^https?:\/\//, '')}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/accounts/${account.id}/edit`}>
                                    <Pencil className="mr-1 size-3.5" />Edit
                                </Link>
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)}>
                                <Trash2 className="mr-1 size-3.5" />Delete
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <StatCard label="Contacts" value={account.contacts.length} />
                    <StatCard label="Opportunities" value={account.deals.length} />
                    <StatCard label="Open pipeline" value={money.format(pipelineValue)} sub={`${openDeals.length} open`} />
                    <StatCard label="Won value" value={money.format(wonValue)} />
                </div>

                {/* Body */}
                <div className="grid gap-5 xl:grid-cols-2">
                    {/* Contacts */}
                    <section className="bg-card rounded-xl border shadow-xs">
                        <div className="flex items-center justify-between border-b px-5 py-3.5">
                            <h2 className="flex items-center gap-2 text-sm font-semibold">
                                <Users className="size-4 text-muted-foreground" />
                                Contacts
                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{account.contacts.length}</span>
                            </h2>
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/contacts/create">+ Add</Link>
                            </Button>
                        </div>
                        {account.contacts.length === 0 ? (
                            <p className="text-muted-foreground px-5 py-8 text-center text-sm">No contacts yet.</p>
                        ) : (
                            <div className="divide-y">
                                {account.contacts.map((contact) => (
                                    <div
                                        key={contact.id}
                                        className="flex cursor-pointer items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/30"
                                        onClick={() => router.visit(`/contacts/${contact.id}`)}
                                    >
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                                            {contactName(contact).split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium">{contactName(contact)}</p>
                                            <p className="text-xs text-muted-foreground">{contact.job_title ?? contact.email ?? '—'}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {contact.phone && (
                                                <a href={`tel:${contact.phone}`} onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-foreground">
                                                    <Phone className="size-3.5" />
                                                </a>
                                            )}
                                            {contact.email && (
                                                <a href={`mailto:${contact.email}`} onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-foreground">
                                                    <Mail className="size-3.5" />
                                                </a>
                                            )}
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[contact.status] ?? 'bg-muted text-muted-foreground'}`}>
                                                {contact.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Opportunities */}
                    <section className="bg-card rounded-xl border shadow-xs">
                        <div className="flex items-center justify-between border-b px-5 py-3.5">
                            <h2 className="flex items-center gap-2 text-sm font-semibold">
                                <BriefcaseBusiness className="size-4 text-muted-foreground" />
                                Opportunities
                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{account.deals.length}</span>
                            </h2>
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/deals/create">+ New</Link>
                            </Button>
                        </div>
                        {account.deals.length === 0 ? (
                            <p className="text-muted-foreground px-5 py-8 text-center text-sm">No opportunities yet.</p>
                        ) : (
                            <div className="divide-y">
                                {account.deals.map((deal) => (
                                    <div
                                        key={deal.id}
                                        className="flex cursor-pointer items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/30"
                                        onClick={() => router.visit(`/deals/${deal.id}`)}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium">{deal.name}</p>
                                            <p className="text-xs text-muted-foreground">Close: {formatDate(deal.expected_close_date)}</p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            <span className="text-sm font-semibold">{money.format(Number(deal.value))}</span>
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_STYLES[deal.stage] ?? 'bg-muted text-muted-foreground'}`}>
                                                {stageLabel(deal.stage)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* Notes */}
                {account.notes && (
                    <section className="bg-card rounded-xl border p-5 shadow-xs">
                        <h2 className="mb-2 text-sm font-semibold">Notes</h2>
                        <p className="text-sm leading-relaxed text-muted-foreground">{account.notes}</p>
                    </section>
                )}
            </div>

            <ConfirmDialog
                open={showDelete}
                onClose={() => setShowDelete(false)}
                onConfirm={() => router.delete(`/accounts/${account.id}`, { onSuccess: () => router.visit('/accounts') })}
                title={`Delete ${account.name}?`}
                description="Contacts and deals will stay, but their account link will be removed. This cannot be undone."
                confirmLabel="Delete account"
            />
        </AppLayout>
    );
}
