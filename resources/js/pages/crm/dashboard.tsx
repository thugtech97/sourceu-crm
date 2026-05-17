import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { BriefcaseBusiness, Building2, DollarSign, Handshake, Phone, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/crm' }];

const STAGE_ORDER = ['new', 'meeting_booked', 'qualified', 'proposal', 'warm_email_nurture'];

type Account = {
    id: number;
    name: string;
};

type Contact = {
    id: number;
    name: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    status: string;
    account?: Account | null;
};

type Deal = {
    id: number;
    name: string;
    stage: string;
    value: string;
    expected_close_date: string | null;
    account?: Account | null;
    contact?: Contact | null;
};

type DealByStage = {
    stage: string;
    count: number;
    total: string;
};

type CallLog = {
    id: number;
    contact_id: number | null;
    direction: string;
    status: string;
    duration_seconds: number | null;
    started_at: string | null;
    contact?: Pick<Contact, 'id' | 'first_name' | 'last_name'> | null;
};

type Props = {
    stats: {
        accounts: number;
        contacts: number;
        openDeals: number;
        pipelineValue: number;
        wonValue: number;
    };
    dealsByStage: DealByStage[];
    recentContacts: Contact[];
    recentDeals: Deal[];
    recentCallLogs: CallLog[];
};

const money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
});

function stageLabel(value: string) {
    return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDuration(seconds: number | null): string {
    if (!seconds) {
        return '—';
    }
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function timeAgo(dateStr: string | null): string {
    if (!dateStr) {
        return '—';
    }
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) {
        return 'just now';
    }
    if (diff < 3600) {
        return `${Math.floor(diff / 60)}m ago`;
    }
    if (diff < 86400) {
        return `${Math.floor(diff / 3600)}h ago`;
    }
    return `${Math.floor(diff / 86400)}d ago`;
}

export default function CrmDashboard({ stats, dealsByStage, recentContacts, recentDeals, recentCallLogs }: Props) {
    const statCards = [
        { label: 'Accounts', value: stats.accounts.toLocaleString(), icon: Building2 },
        { label: 'Contacts', value: stats.contacts.toLocaleString(), icon: Users },
        { label: 'Open deals', value: stats.openDeals.toLocaleString(), icon: Handshake },
        { label: 'Pipeline', value: money.format(stats.pipelineValue), icon: BriefcaseBusiness },
        { label: 'Won', value: money.format(stats.wonValue), icon: DollarSign },
    ];

    const stageMap = Object.fromEntries(dealsByStage.map((d) => [d.stage, d]));
    const maxStageTotal = Math.max(...dealsByStage.map((d) => Number(d.total)), 1);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Dashboard</h1>
                        <p className="text-muted-foreground text-sm">Track contacts, pipeline, and customer work in one place.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link href="/accounts/create">New account</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/contacts/create">New contact</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/deals/create">New deal</Link>
                        </Button>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
                    {statCards.map((card) => (
                        <div key={card.label} className="bg-card rounded-lg border p-4 shadow-xs">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-muted-foreground text-sm">{card.label}</p>
                                <card.icon className="text-muted-foreground size-4" />
                            </div>
                            <p className="mt-3 text-2xl font-semibold">{card.value}</p>
                        </div>
                    ))}
                </div>

                {/* Pipeline breakdown */}
                <section className="bg-card rounded-lg border shadow-xs">
                    <div className="border-b p-4">
                        <h2 className="font-semibold">Pipeline by stage</h2>
                        <p className="text-muted-foreground text-xs">Open deals only — excludes Won, Lost, DNC</p>
                    </div>
                    {dealsByStage.length === 0 ? (
                        <p className="text-muted-foreground p-4 text-sm">No open deals yet.</p>
                    ) : (
                        <div className="divide-y">
                            {STAGE_ORDER.filter((s) => stageMap[s]).map((stage) => {
                                const row = stageMap[stage];
                                const pct = Math.round((Number(row.total) / maxStageTotal) * 100);
                                return (
                                    <div key={stage} className="flex items-center gap-4 px-4 py-3">
                                        <span className="w-36 shrink-0 text-sm font-medium">{stageLabel(stage)}</span>
                                        <div className="flex-1">
                                            <div className="bg-muted h-2 rounded-full">
                                                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                        <span className="text-muted-foreground w-8 shrink-0 text-right text-sm">{row.count}</span>
                                        <span className="w-24 shrink-0 text-right text-sm font-medium">{money.format(Number(row.total))}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Recent activity grid */}
                <div className="grid gap-4 xl:grid-cols-3">
                    {/* Recent contacts */}
                    <section className="bg-card rounded-lg border shadow-xs">
                        <div className="flex items-center justify-between gap-3 border-b p-4">
                            <h2 className="font-semibold">Recent contacts</h2>
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/contacts">View all</Link>
                            </Button>
                        </div>
                        <div className="divide-y">
                            {recentContacts.length === 0 && <p className="text-muted-foreground p-4 text-sm">No contacts yet.</p>}
                            {recentContacts.map((contact) => (
                                <Link key={contact.id} href={`/contacts/${contact.id}/edit`} className="hover:bg-muted/50 block p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="font-medium">{contact.name}</p>
                                        <span className="bg-secondary rounded-md px-2 py-1 text-xs capitalize">{contact.status}</span>
                                    </div>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        {contact.account?.name ?? contact.email ?? contact.phone ?? 'No company yet'}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* Recent deals */}
                    <section className="bg-card rounded-lg border shadow-xs">
                        <div className="flex items-center justify-between gap-3 border-b p-4">
                            <h2 className="font-semibold">Recent deals</h2>
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/deals">View all</Link>
                            </Button>
                        </div>
                        <div className="divide-y">
                            {recentDeals.length === 0 && <p className="text-muted-foreground p-4 text-sm">No deals yet.</p>}
                            {recentDeals.map((deal) => (
                                <Link key={deal.id} href={`/deals/${deal.id}/edit`} className="hover:bg-muted/50 block p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="font-medium">{deal.name}</p>
                                        <span className="font-medium">{money.format(Number(deal.value))}</span>
                                    </div>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        {stageLabel(deal.stage)}
                                        {deal.account?.name ? ` · ${deal.account.name}` : ''}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* Recent calls */}
                    <section className="bg-card rounded-lg border shadow-xs">
                        <div className="flex items-center justify-between gap-3 border-b p-4">
                            <h2 className="font-semibold">Recent calls</h2>
                            <Phone className="text-muted-foreground size-4" />
                        </div>
                        <div className="divide-y">
                            {recentCallLogs.length === 0 && <p className="text-muted-foreground p-4 text-sm">No calls logged yet.</p>}
                            {recentCallLogs.map((log) => (
                                <div key={log.id} className="flex items-center justify-between gap-3 p-4">
                                    <div className="min-w-0">
                                        <p className="truncate font-medium">
                                            {log.contact
                                                ? `${log.contact.first_name} ${log.contact.last_name}`
                                                : 'Unknown contact'}
                                        </p>
                                        <p className="text-muted-foreground text-sm capitalize">
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
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
