import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Deals', href: '/deals' },
    { title: 'New deal', href: '/deals/create' },
];

type Account = {
    id: number;
    name: string;
};

type Contact = {
    id: number;
    name: string;
};

type Props = {
    accounts: Account[];
    contacts: Contact[];
};

type DealForm = {
    account_id: string;
    contact_id: string;
    name: string;
    stage: string;
    value: string;
    expected_close_date: string;
    probability: string;
    notes: string;
};

export default function CreateDeal({ accounts, contacts }: Props) {
    const { data, setData, post, processing, errors } = useForm<DealForm>({
        account_id: '',
        contact_id: '',
        name: '',
        stage: 'new',
        value: '0',
        expected_close_date: '',
        probability: '10',
        notes: '',
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        post('/deals');
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New deal" />

            <div className="max-w-3xl p-4">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">New deal</h1>
                    <p className="text-muted-foreground text-sm">Add an opportunity to your pipeline.</p>
                </div>

                <form onSubmit={submit} className="bg-card space-y-6 rounded-lg border p-6 shadow-xs">
                    <DealFields accounts={accounts} contacts={contacts} data={data} setData={setData} errors={errors} />

                    <div className="flex gap-2">
                        <Button disabled={processing}>Create deal</Button>
                        <Button asChild variant="outline">
                            <Link href="/deals">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

function DealFields({
    accounts,
    contacts,
    data,
    setData,
    errors,
}: {
    accounts: Account[];
    contacts: Contact[];
    data: DealForm;
    setData: <K extends keyof DealForm>(key: K, value: DealForm[K]) => void;
    errors: Partial<Record<keyof DealForm, string>>;
}) {
    return (
        <>
            <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="name">Deal name</Label>
                    <Input id="name" value={data.name} onChange={(event) => setData('name', event.target.value)} required />
                    <InputError message={errors.name} />
                </div>
                <div className="grid gap-2">
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
                <div className="grid gap-2">
                    <Label htmlFor="contact_id">Contact</Label>
                    <select
                        id="contact_id"
                        className="border-input bg-background h-10 rounded-md border px-3 text-sm"
                        value={data.contact_id}
                        onChange={(event) => setData('contact_id', event.target.value)}
                    >
                        <option value="">No contact</option>
                        {contacts.map((contact) => (
                            <option key={contact.id} value={String(contact.id)}>
                                {contact.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.contact_id} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="stage">Stage</Label>
                    <select
                        id="stage"
                        className="border-input bg-background h-10 rounded-md border px-3 text-sm"
                        value={data.stage}
                        onChange={(event) => setData('stage', event.target.value)}
                    >
                        <option value="new">New</option>
                        <option value="qualified">Qualified</option>
                        <option value="proposal">Proposal</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                    </select>
                    <InputError message={errors.stage} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="value">Value</Label>
                    <Input
                        id="value"
                        type="number"
                        min="0"
                        step="0.01"
                        value={data.value}
                        onChange={(event) => setData('value', event.target.value)}
                    />
                    <InputError message={errors.value} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="expected_close_date">Expected close date</Label>
                    <Input
                        id="expected_close_date"
                        type="date"
                        value={data.expected_close_date}
                        onChange={(event) => setData('expected_close_date', event.target.value)}
                    />
                    <InputError message={errors.expected_close_date} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="probability">Probability</Label>
                    <Input
                        id="probability"
                        type="number"
                        min="0"
                        max="100"
                        value={data.probability}
                        onChange={(event) => setData('probability', event.target.value)}
                    />
                    <InputError message={errors.probability} />
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
