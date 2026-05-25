import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, BriefcaseBusiness, Building2, DollarSign, Handshake, Mail, Phone, PhoneIncoming, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/crm' }];

const STAGE_ORDER = ['new', 'meeting_booked', 'qualified', 'proposal', 'warm_email_nurture'];

const STAGE_COLORS: Record<string, string> = {
    new: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    meeting_booked: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    qualified: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    proposal: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    warm_email_nurture: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
};

type Account = { id: number; name: string };
type Contact = {
    id: number; name: string; first_name: string; last_name: string;
    email: string | null; phone: string | null; status: string; account?: Account | null;
};
type Deal = {
    id: number; name: string; stage: string; value: string;
    expected_close_date: string | null; account?: Account | null; contact?: Contact | null;
};
type DealByStage = { stage: string; count: number; total: string };
type CallLog = {
    id: number; contact_id: number | null; direction: string; status: string;
    duration_seconds: number | null; started_at: string | null;
    contact?: Pick<Contact, 'id' | 'first_name' | 'last_name'> | null;
};
type Props = {
    stats: {
        accounts: number; contacts: number; openDeals: number;
        pipelineValue: number; wonValue: number; poolLeads: number; warmEmail: number;
    };
    dealsByStage: DealByStage[];
    recentContacts: Contact[];
    recentDeals: Deal[];
    recentCallLogs: CallLog[];
};

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function stageLabel(value: string) {
    return value.replaceAll('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatDuration(seconds: number | null): string {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function timeAgo(dateStr: string | null): string {
    if (!dateStr) return '—';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function initials(name: string): string {
    return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
}

const STATUS_COLORS: Record<string, string> = {
    lead: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    prospect: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    customer: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    inactive: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const CALL_STATUS_COLORS: Record<string, string> = {
    connected: 'text-green-600',
    ended: 'text-slate-500',
    missed: 'text-red-500',
    initiated: 'text-blue-500',
};

export default function CrmDashboard({ stats, dealsByStage, recentContacts, recentDeals, recentCallLogs }: Props) {
    const stageMap = Object.fromEntries(dealsByStage.map((d) => [d.stage, d]));
    const maxStageTotal = Math.max(...dealsByStage.map((d) => Number(d.total)), 1);

    const kpiCards = [
        { label: 'Pipeline value', value: money.format(stats.pipelineValue), icon: BriefcaseBusiness, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
        { label: 'Won', value: money.format(stats.wonValue), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950' },
        { label: 'Open deals', value: stats.openDeals.toLocaleString(), icon: Handshake, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
        { label: 'Pool leads', value: stats.poolLeads.toLocaleString(), icon: PhoneIncoming, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
        { label: 'Warm email', value: stats.warmEmail.toLocaleString(), icon: Mail, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950' },
        { label: 'Contacts', value: stats.contacts.toLocaleString(), icon: Users, color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-800' },
        { label: 'Accounts', value: stats.accounts.toLocaleString(), icon: Building2, color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-800' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Dashboard</h1>
                        <p className="text-muted-foreground text-sm">Your sales overview at a glance.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm">
                            <Link href="/contacts/create">New contact</Link>
                        </Button>
                        <Button asChild size="sm">
                            <Link href="/deals/create">New deal</Link>
                        </Button>
                    </div>
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
                    {kpiCards.map((card) => (
                        <div key={card.label} className="bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-xs">
                            <div className={`flex size-9 items-center justify-center rounded-lg ${card.bg}`}>
                                <card.icon className={`size-4 ${card.color}`} />
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs">{card.label}</p>
                                <p className="text-xl font-bold">{card.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pipeline + Recent activity */}
                <div className="grid gap-4 xl:grid-cols-3">
                    {/* Pipeline by stage */}
                    <section className="bg-card col-span-1 rounded-xl border shadow-xs xl:col-span-1">
                        <div className="flex items-center justify-between border-b px-4 py-3">
                            <h2 className="font-semibold">Pipeline by stage</h2>
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/deals/kanban">
                                    Kanban <ArrowRight className="ml-1 size-3.5" />
                                </Link>
                            </Button>
                        </div>
                        {dealsByStage.length === 0 ? (
                            <p className="text-muted-foreground p-4 text-sm">No open deals yet.</p>
                        ) : (
                            <div className="divide-y">
                                {STAGE_ORDER.filter((s) => stageMap[s]).map((stage) => {
                                    const row = stageMap[stage];
                                    const pct = Math.round((Number(row.total) / maxStageTotal) * 100);
                                    return (
                                        <div key={stage} className="px-4 py-3">
                                            <div className="mb-1.5 flex items-center justify-between gap-2">
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_COLORS[stage] ?? 'bg-muted text-muted-foreground'}`}>
                                                    {stageLabel(stage)}
                                                </span>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="text-muted-foreground">{row.count} deals</span>
                                                    <span className="font-medium">{money.format(Number(row.total))}</span>
                                                </div>
                                            </div>
                                            <div className="bg-muted h-1.5 rounded-full">
                                                <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* Recent contacts */}
                    <section className="bg-card rounded-xl border shadow-xs">
                        <div className="flex items-center justify-between border-b px-4 py-3">
                            <h2 className="font-semibold">Recent contacts</h2>
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/contacts">View all</Link>
                            </Button>
                        </div>
                        <div className="divide-y">
                            {recentContacts.length === 0 && <p className="text-muted-foreground p-4 text-sm">No contacts yet.</p>}
                            {recentContacts.map((contact) => (
                                <Link key={contact.id} href={`/contacts/${contact.id}/edit`} className="hover:bg-muted/40 flex items-center gap-3 px-4 py-3 transition-colors">
                                    <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                                        {initials(contact.name)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{contact.name}</p>
                                        <p className="text-muted-foreground truncate text-xs">
                                            {contact.account?.name ?? contact.email ?? '—'}
                                        </p>
                                    </div>
                                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[contact.status] ?? 'bg-muted text-muted-foreground'}`}>
                                        {contact.status}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* Recent deals */}
                    <section className="bg-card rounded-xl border shadow-xs">
                        <div className="flex items-center justify-between border-b px-4 py-3">
                            <h2 className="font-semibold">Recent deals</h2>
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/deals">View all</Link>
                            </Button>
                        </div>
                        <div className="divide-y">
                            {recentDeals.length === 0 && <p className="text-muted-foreground p-4 text-sm">No deals yet.</p>}
                            {recentDeals.map((deal) => (
                                <Link key={deal.id} href={`/deals/${deal.id}/edit`} className="hover:bg-muted/40 flex items-center gap-3 px-4 py-3 transition-colors">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{deal.name}</p>
                                        <p className="text-muted-foreground truncate text-xs">
                                            {deal.contact ? `${deal.contact.first_name} ${deal.contact.last_name}` : deal.account?.name ?? '—'}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-sm font-semibold">{money.format(Number(deal.value))}</p>
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_COLORS[deal.stage] ?? 'bg-muted text-muted-foreground'}`}>
                                            {stageLabel(deal.stage)}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Recent calls */}
                <section className="bg-card rounded-xl border shadow-xs">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <h2 className="font-semibold">Recent calls</h2>
                        <Phone className="text-muted-foreground size-4" />
                    </div>
                    {recentCallLogs.length === 0 ? (
                        <p className="text-muted-foreground p-4 text-sm">No calls logged yet.</p>
                    ) : (
                        <div className="grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3">
                            {recentCallLogs.map((log) => (
                                <div key={log.id} className="flex items-center gap-3 px-4 py-3">
                                    <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${log.status === 'connected' || log.status === 'ended' ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
                                        <Phone className={`size-3.5 ${CALL_STATUS_COLORS[log.status] ?? 'text-muted-foreground'}`} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">
                                            {log.contact ? `${log.contact.first_name} ${log.contact.last_name}` : 'Unknown'}
                                        </p>
                                        <p className="text-muted-foreground text-xs capitalize">
                                            {log.direction} · {log.status}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-sm">{formatDuration(log.duration_seconds)}</p>
                                        <p className="text-muted-foreground text-xs">{timeAgo(log.started_at)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
