import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Contacts', href: '/contacts' }];

type Contact = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    job_title: string | null;
    status: string;
    account?: { name: string } | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Props = {
    contacts: {
        data: Contact[];
        links: PaginationLink[];
    };
    filters: {
        search: string;
    };
};

export default function ContactsIndex({ contacts, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    function submit(event: FormEvent) {
        event.preventDefault();
        router.get('/contacts', { search }, { preserveState: true, replace: true });
    }

    function destroy(contact: Contact) {
        if (confirm(`Delete ${contact.name}?`)) {
            router.delete(`/contacts/${contact.id}`);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Contacts" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Contacts</h1>
                        <p className="text-muted-foreground text-sm">People you are selling to, supporting, or nurturing.</p>
                    </div>
                    <Button asChild>
                        <Link href="/contacts/create">New contact</Link>
                    </Button>
                </div>

                <form onSubmit={submit} className="flex max-w-xl gap-2">
                    <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search contacts" />
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
                                    <th className="px-4 py-3 font-medium">Company</th>
                                    <th className="px-4 py-3 font-medium">Email</th>
                                    <th className="px-4 py-3 font-medium">Phone</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {contacts.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-muted-foreground px-4 py-8 text-center">
                                            No contacts found.
                                        </td>
                                    </tr>
                                )}
                                {contacts.data.map((contact) => (
                                    <tr key={contact.id}>
                                        <td className="px-4 py-3">
                                            <Link href={`/contacts/${contact.id}/edit`} className="font-medium hover:underline">
                                                {contact.name}
                                            </Link>
                                            {contact.job_title && <p className="text-muted-foreground text-xs">{contact.job_title}</p>}
                                        </td>
                                        <td className="px-4 py-3">{contact.account?.name ?? '-'}</td>
                                        <td className="px-4 py-3">{contact.email ?? '-'}</td>
                                        <td className="px-4 py-3">{contact.phone ?? '-'}</td>
                                        <td className="px-4 py-3 capitalize">{contact.status}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={`/contacts/${contact.id}/edit`}>Edit</Link>
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => destroy(contact)}>
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
                    {contacts.links.map((link) => (
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
