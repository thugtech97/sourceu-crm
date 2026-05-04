import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Accounts', href: '/accounts' },
    { title: 'New account', href: '/accounts/create' },
];

type AccountForm = {
    name: string;
    industry: string;
    website: string;
    phone: string;
    notes: string;
};

export default function CreateAccount() {
    const { data, setData, post, processing, errors } = useForm<AccountForm>({
        name: '',
        industry: '',
        website: '',
        phone: '',
        notes: '',
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        post('/accounts');
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New account" />

            <div className="max-w-3xl p-4">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">New account</h1>
                    <p className="text-muted-foreground text-sm">Add a company or organization.</p>
                </div>

                <form onSubmit={submit} className="bg-card space-y-6 rounded-lg border p-6 shadow-xs">
                    <AccountFields data={data} setData={setData} errors={errors} />

                    <div className="flex gap-2">
                        <Button disabled={processing}>Create account</Button>
                        <Button asChild variant="outline">
                            <Link href="/accounts">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

function AccountFields({
    data,
    setData,
    errors,
}: {
    data: AccountForm;
    setData: <K extends keyof AccountForm>(key: K, value: AccountForm[K]) => void;
    errors: Partial<Record<keyof AccountForm, string>>;
}) {
    return (
        <>
            <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={data.name} onChange={(event) => setData('name', event.target.value)} required />
                    <InputError message={errors.name} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input id="industry" value={data.industry} onChange={(event) => setData('industry', event.target.value)} />
                    <InputError message={errors.industry} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={data.phone} onChange={(event) => setData('phone', event.target.value)} />
                    <InputError message={errors.phone} />
                </div>
                <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                        id="website"
                        type="url"
                        value={data.website}
                        onChange={(event) => setData('website', event.target.value)}
                        placeholder="https://example.com"
                    />
                    <InputError message={errors.website} />
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
