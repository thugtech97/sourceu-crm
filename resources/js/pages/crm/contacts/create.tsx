import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Contacts', href: '/contacts' },
    { title: 'New contact', href: '/contacts/create' },
];

type Account = {
    id: number;
    name: string;
};

type Props = {
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
    source_type: string;
    notes: string;
};

export default function CreateContact({ accounts }: Props) {
    const { data, setData, post, processing, errors } = useForm<ContactForm>({
        account_id: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        job_title: '',
        status: 'lead',
        source_type: 'inbound',
        notes: '',
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        post('/contacts');
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New contact" />

            <div className="max-w-3xl p-4">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">New contact</h1>
                    <p className="text-muted-foreground text-sm">Add a person to your CRM.</p>
                </div>

                <form onSubmit={submit} className="bg-card space-y-6 rounded-lg border p-6 shadow-xs">
                    <ContactFields accounts={accounts} data={data} setData={setData} errors={errors} />

                    <div className="flex gap-2">
                        <Button disabled={processing}>Create contact</Button>
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
                {data.status === 'lead' && (
                    <div className="grid gap-2">
                        <Label htmlFor="source_type">Lead pool</Label>
                        <select
                            id="source_type"
                            className="border-input bg-background h-10 rounded-md border px-3 text-sm"
                            value={data.source_type}
                            onChange={(event) => setData('source_type', event.target.value)}
                        >
                            <option value="inbound">Inbound Sales</option>
                            <option value="cold">Cold Calling</option>
                        </select>
                        <InputError message={errors.source_type} />
                    </div>
                )}
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
