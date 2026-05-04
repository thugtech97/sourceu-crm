import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Accounts', href: '/accounts' }];

type Account = {
    id: number;
    name: string;
    industry: string | null;
    website: string | null;
    phone: string | null;
    contacts_count: number;
    deals_count: number;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Props = {
    accounts: {
        data: Account[];
        links: PaginationLink[];
    };
    filters: {
        search: string;
    };
};

export default function AccountsIndex({ accounts, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function submit(event: FormEvent) {
        event.preventDefault();
        router.get('/accounts', { search }, { preserveState: true, replace: true });
    }

    function destroy(account: Account) {
        if (confirm(`Delete ${account.name}? Contacts and deals will stay, but their account link will be removed.`)) {
            router.delete(`/accounts/${account.id}`);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Accounts" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Accounts</h1>
                        <p className="text-muted-foreground text-sm">Companies and organizations connected to your pipeline.</p>
                    </div>
                    <Button asChild>
                        <Link href="/accounts/create">New account</Link>
                    </Button>
                </div>

                <form onSubmit={submit} className="flex max-w-xl gap-2">
                    <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search accounts" />
                    <Button type="submit" variant="outline">
                        Search
                    </Button>
                </form>

                <div className="bg-card overflow-hidden rounded-lg border shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/60 text-left">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Name</th>
                                    <th className="px-4 py-3 font-medium">Industry</th>
                                    <th className="px-4 py-3 font-medium">Phone</th>
                                    <th className="px-4 py-3 font-medium">Contacts</th>
                                    <th className="px-4 py-3 font-medium">Deals</th>
                                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {accounts.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-muted-foreground px-4 py-8 text-center">
                                            No accounts found.
                                        </td>
                                    </tr>
                                )}
                                {accounts.data.map((account) => (
                                    <tr key={account.id}>
                                        <td className="px-4 py-3">
                                            <Link href={`/accounts/${account.id}/edit`} className="font-medium hover:underline">
                                                {account.name}
                                            </Link>
                                            {account.website && <p className="text-muted-foreground text-xs">{account.website}</p>}
                                        </td>
                                        <td className="px-4 py-3">{account.industry ?? '-'}</td>
                                        <td className="px-4 py-3">{account.phone ?? '-'}</td>
                                        <td className="px-4 py-3">{account.contacts_count}</td>
                                        <td className="px-4 py-3">{account.deals_count}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={`/accounts/${account.id}/edit`}>Edit</Link>
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => destroy(account)}>
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
                    {accounts.links.map((link) => (
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
