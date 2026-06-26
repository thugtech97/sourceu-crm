import ConfirmDialog from '@/components/confirm-dialog';
import FlashAlert from '@/components/flash-alert';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { LoaderCircle, Pencil, Phone, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Contacts', href: '/contacts' }];

const STATUS_STYLES: Record<string, { dot: string; badge: string }> = {
    lead:     { dot: 'bg-blue-500',  badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
    prospect: { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
    customer: { dot: 'bg-green-500', badge: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    inactive: { dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
};

const SOURCE_STYLES: Record<string, string> = {
    inbound: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
    cold:    'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
};

type Contact = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    job_title: string | null;
    status: string;
    source_type: string;
    account?: { name: string } | null;
};

type PaginationLink = { url: string | null; label: string; active: boolean };

type Props = {
    contacts: { data: Contact[]; links: PaginationLink[] };
    filters: { search: string };
};

function initials(name: string): string {
    return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
}

export default function ContactsIndex({ contacts, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [dialingContactId, setDialingContactId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState<Contact | null>(null);
    const { errors } = usePage<SharedData & { errors: Partial<Record<string, string>> }>().props;

    function submit(event: FormEvent) {
        event.preventDefault();
        router.get('/contacts', { search }, { preserveState: true, replace: true });
    }

    function confirmDelete() {
        if (!deleting) return;
        router.delete(`/contacts/${deleting.id}`, { onFinish: () => setDeleting(null) });
    }

    function dial(contact: Contact) {
        setDialingContactId(contact.id);
        router.post(`/contacts/${contact.id}/dialpad/dial`, {}, {
            preserveScroll: true,
            onFinish: () => setDialingContactId(null),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Contacts" />

            <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Contacts</h1>
                        <p className="text-muted-foreground text-sm">People you are selling to, supporting, or nurturing.</p>
                    </div>
                    <Button asChild size="sm">
                        <Link href="/contacts/create">+ New contact</Link>
                    </Button>
                </div>

                <form onSubmit={submit} className="flex max-w-sm gap-2">
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email or phone…" className="h-9" />
                    <Button type="submit" variant="outline" size="sm">Search</Button>
                </form>

                <FlashAlert />
                {errors.dialpad && (
                    <Alert variant="destructive">
                        <AlertTitle>Dialpad call failed</AlertTitle>
                        <AlertDescription>{errors.dialpad}</AlertDescription>
                    </Alert>
                )}

                <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/50 border-b text-left">
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</th>
                                <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:table-cell">Company</th>
                                <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:table-cell">Email</th>
                                <th className="hidden px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:table-cell">Phone</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {contacts.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-muted-foreground px-4 py-12 text-center">
                                        No contacts found.
                                    </td>
                                </tr>
                            )}
                            {contacts.data.map((contact) => {
                                const statusStyle = STATUS_STYLES[contact.status] ?? STATUS_STYLES.inactive;
                                return (
                                    <tr key={contact.id} className="hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => router.visit(`/contacts/${contact.id}`)}>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                                                    {initials(contact.name)}
                                                </div>
                                                <div className="min-w-0">
                                                    <Link href={`/contacts/${contact.id}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
                                                        {contact.name}
                                                    </Link>
                                                    {contact.job_title && (
                                                        <p className="text-muted-foreground truncate text-xs">{contact.job_title}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden px-4 py-3 md:table-cell">
                                            <span className="text-muted-foreground">{contact.account?.name ?? '—'}</span>
                                        </td>
                                        <td className="hidden px-4 py-3 lg:table-cell">
                                            {contact.email
                                                ? <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline dark:text-blue-400">{contact.email}</a>
                                                : <span className="text-muted-foreground">—</span>}
                                        </td>
                                        <td className="hidden px-4 py-3 lg:table-cell">
                                            {contact.phone
                                                ? <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline dark:text-blue-400">{contact.phone}</a>
                                                : <span className="text-muted-foreground">—</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyle.badge}`}>
                                                    <span className={`size-1.5 rounded-full ${statusStyle.dot}`} />
                                                    {contact.status}
                                                </span>
                                                {contact.source_type && (
                                                    <span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium capitalize ${SOURCE_STYLES[contact.source_type] ?? 'bg-muted text-muted-foreground'}`}>
                                                        {contact.source_type}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <TooltipProvider delayDuration={0}>
                                                <div className="flex justify-end gap-1">
                                                    {contact.phone && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="sm" disabled={dialingContactId === contact.id} onClick={(e) => { e.stopPropagation(); dial(contact); }}>
                                                                    {dialingContactId === contact.id
                                                                        ? <LoaderCircle className="size-4 animate-spin" />
                                                                        : <Phone className="size-4" />}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Call</TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                                                                <Link href={`/contacts/${contact.id}/edit`}>
                                                                    <Pencil className="size-4" />
                                                                </Link>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Edit</TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleting(contact); }}>
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Delete</TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </TooltipProvider>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap gap-2">
                    {contacts.links.map((link) => (
                        <Button key={link.label} asChild={Boolean(link.url)} disabled={!link.url} variant={link.active ? 'default' : 'outline'} size="sm">
                            {link.url
                                ? <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} />
                                : <span dangerouslySetInnerHTML={{ __html: link.label }} />}
                        </Button>
                    ))}
                </div>
            </div>

            <ConfirmDialog
                open={Boolean(deleting)}
                onClose={() => setDeleting(null)}
                onConfirm={confirmDelete}
                title={`Delete ${deleting?.name}?`}
                description="This contact will be permanently deleted and cannot be recovered."
                confirmLabel="Delete contact"
            />
        </AppLayout>
    );
}
