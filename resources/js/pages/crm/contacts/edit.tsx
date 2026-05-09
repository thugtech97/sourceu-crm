import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEvent, useState } from 'react';

type Account = {
    id: number;
    name: string;
};

type Contact = {
    id: number;
    account_id: number | null;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    job_title: string | null;
    status: string;
    notes: string | null;
};

type Props = {
    contact: Contact;
    accounts: Account[];
};

type ContactForm = {
    account_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    job_title: string;
    status: string;
    notes: string;
};

export default function EditContact({ contact, accounts }: Props) {
    const { errors: pageErrors, flash } = usePage<SharedData & { errors: Partial<Record<string, string>> }>().props;
    const [dialing, setDialing] = useState(false);
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Contacts', href: '/contacts' },
        { title: `${contact.first_name} ${contact.last_name}`, href: `/contacts/${contact.id}/edit` },
    ];
    const { data, setData, patch, processing, errors } = useForm<ContactForm>({
        account_id: contact.account_id ? String(contact.account_id) : '',
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email ?? '',
        phone: contact.phone ?? '',
        job_title: contact.job_title ?? '',
        status: contact.status,
        notes: contact.notes ?? '',
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        patch(`/contacts/${contact.id}`);
    }

    function dial() {
        setDialing(true);
        router.post(
            `/contacts/${contact.id}/dialpad/dial`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setDialing(false),
            },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit contact" />

            <div className="max-w-3xl p-4">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">Edit contact</h1>
                    <p className="text-muted-foreground text-sm">Keep this relationship current.</p>
                    {contact.phone && (
                        <Button type="button" variant="outline" className="mt-4" disabled={dialing} onClick={dial}>
                            {dialing && <LoaderCircle className="size-4 animate-spin" />}
                            {dialing ? 'Dialing...' : 'Dial with Dialpad'}
                        </Button>
                    )}
                </div>

                {pageErrors.dialpad && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertTitle>Dialpad call failed</AlertTitle>
                        <AlertDescription>{pageErrors.dialpad}</AlertDescription>
                    </Alert>
                )}
                {flash.status && (
                    <Alert className="mb-6">
                        <AlertTitle>Dialpad</AlertTitle>
                        <AlertDescription>{flash.status}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={submit} className="bg-card space-y-6 rounded-lg border p-6 shadow-xs">
                    <ContactFields accounts={accounts} data={data} setData={setData} errors={errors} />

                    <div className="flex gap-2">
                        <Button disabled={processing}>Save contact</Button>
                        <Button asChild variant="outline">
                            <Link href="/contacts">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

function ContactFields({
    accounts,
    data,
    setData,
    errors,
}: {
    accounts: Account[];
    data: ContactForm;
    setData: <K extends keyof ContactForm>(key: K, value: ContactForm[K]) => void;
    errors: Partial<Record<keyof ContactForm, string>>;
}) {
    return (
        <>
            <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="first_name">First name</Label>
                    <Input id="first_name" value={data.first_name} onChange={(event) => setData('first_name', event.target.value)} required />
                    <InputError message={errors.first_name} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="last_name">Last name</Label>
                    <Input id="last_name" value={data.last_name} onChange={(event) => setData('last_name', event.target.value)} required />
                    <InputError message={errors.last_name} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={data.email} onChange={(event) => setData('email', event.target.value)} />
                    <InputError message={errors.email} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={data.phone} onChange={(event) => setData('phone', event.target.value)} />
                    <InputError message={errors.phone} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="job_title">Job title</Label>
                    <Input id="job_title" value={data.job_title} onChange={(event) => setData('job_title', event.target.value)} />
                    <InputError message={errors.job_title} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                        id="status"
                        className="border-input bg-background h-10 rounded-md border px-3 text-sm"
                        value={data.status}
                        onChange={(event) => setData('status', event.target.value)}
                    >
                        <option value="lead">Lead</option>
                        <option value="prospect">Prospect</option>
                        <option value="customer">Customer</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <InputError message={errors.status} />
                </div>
                <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="account_id">Account</Label>
                    <select
                        id="account_id"
                        className="border-input bg-background h-10 rounded-md border px-3 text-sm"
                        value={data.account_id}
                        onChange={(event) => setData('account_id', event.target.value)}
                    >
                        <option value="">No account</option>
                        {accounts.map((account) => (
                            <option key={account.id} value={String(account.id)}>
                                {account.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.account_id} />
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                    id="notes"
                    className="border-input bg-background min-h-28 rounded-md border px-3 py-2 text-sm"
                    value={data.notes}
                    onChange={(event) => setData('notes', event.target.value)}
                />
                <InputError message={errors.notes} />
            </div>
        </>
    );
}
