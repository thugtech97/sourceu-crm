import FlashAlert from '@/components/flash-alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Deals', href: '/deals' }];

type Deal = {
    id: number;
    name: string;
    stage: string;
    value: string;
    expected_close_date: string | null;
    probability: number;
    account?: { name: string } | null;
    contact?: { name: string } | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Props = {
    deals: {
        data: Deal[];
        links: PaginationLink[];
    };
    filters: {
        search: string;
    };
};

const money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
});

function stageLabel(value: string) {
    return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function DealsIndex({ deals, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function submit(event: FormEvent) {
        event.preventDefault();
        router.get('/deals', { search }, { preserveState: true, replace: true });
    }

    function destroy(deal: Deal) {
        if (confirm(`Delete ${deal.name}?`)) {
            router.delete(`/deals/${deal.id}`);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Deals" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Deals</h1>
                        <p className="text-muted-foreground text-sm">Track sales opportunities from first touch to close.</p>
                    </div>
                    <Button asChild>
                        <Link href="/deals/create">New deal</Link>
                    </Button>
                </div>

                <form onSubmit={submit} className="flex max-w-xl gap-2">
                    <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search deals" />
                    <Button type="submit" variant="outline">
                        Search
                    </Button>
                </form>

                <FlashAlert />

                <div className="bg-card overflow-hidden rounded-lg border shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/60 text-left">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Deal</th>
                                    <th className="px-4 py-3 font-medium">Account</th>
                                    <th className="px-4 py-3 font-medium">Stage</th>
                                    <th className="px-4 py-3 font-medium">Value</th>
                                    <th className="px-4 py-3 font-medium">Close date</th>
                                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {deals.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-muted-foreground px-4 py-8 text-center">
                                            No deals found.
                                        </td>
                                    </tr>
                                )}
                                {deals.data.map((deal) => (
                                    <tr key={deal.id}>
                                        <td className="px-4 py-3">
                                            <Link href={`/deals/${deal.id}/edit`} className="font-medium hover:underline">
                                                {deal.name}
                                            </Link>
                                            {deal.contact?.name && <p className="text-muted-foreground text-xs">{deal.contact.name}</p>}
                                        </td>
                                        <td className="px-4 py-3">{deal.account?.name ?? '-'}</td>
                                        <td className="px-4 py-3">{stageLabel(deal.stage)}</td>
                                        <td className="px-4 py-3">{money.format(Number(deal.value))}</td>
                                        <td className="px-4 py-3">{deal.expected_close_date ?? '-'}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={`/deals/${deal.id}/edit`}>Edit</Link>
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => destroy(deal)}>
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {deals.links.map((link) => (
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
        </AppLayout>
    );
}
