import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { BriefcaseBusiness, Building2, DollarSign, Handshake, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'CRM', href: '/crm' }];

type Account = {
    id: number;
    name: string;
};

type Contact = {
    id: number;
    name: string;
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

type Props = {
    stats: {
        accounts: number;
        contacts: number;
        openDeals: number;
        pipelineValue: number;
        wonValue: number;
    };
    recentContacts: Contact[];
    recentDeals: Deal[];
};

const money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
});

function stageLabel(value: string) {
    return value.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function CrmDashboard({ stats, recentContacts, recentDeals }: Props) {
    const cards = [
        { label: 'Accounts', value: stats.accounts.toLocaleString(), icon: Building2 },
        { label: 'Contacts', value: stats.contacts.toLocaleString(), icon: Users },
        { label: 'Open deals', value: stats.openDeals.toLocaleString(), icon: Handshake },
        { label: 'Pipeline', value: money.format(stats.pipelineValue), icon: BriefcaseBusiness },
        { label: 'Won', value: money.format(stats.wonValue), icon: DollarSign },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="CRM" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">CRM</h1>
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

                <div className="grid gap-4 md:grid-cols-4">
                    {cards.map((card) => (
                        <div key={card.label} className="bg-card rounded-lg border p-4 shadow-xs">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-muted-foreground text-sm">{card.label}</p>
                                <card.icon className="text-muted-foreground size-4" />
                            </div>
                            <p className="mt-3 text-2xl font-semibold">{card.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
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
                                        {deal.account?.name ? ` with ${deal.account.name}` : ''}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
