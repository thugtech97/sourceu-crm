import FlashAlert from '@/components/flash-alert';
import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle, Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing } from 'lucide-react';
import { FormEvent, useState } from 'react';

const dialpadActionsDisabled = true;

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

type CallLog = {
    id: number;
    direction: string;
    status: string;
    duration_seconds: number | null;
    recording_url: string | null;
    transcript_text: string | null;
    started_at: string | null;
};

type Props = {
    contact: Contact;
    accounts: Account[];
    callLogs: CallLog[];
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

function formatDuration(seconds: number | null): string {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function CallStatusIcon({ direction, status }: { direction: string; status: string }) {
    if (status === 'missed') return <PhoneMissed className="size-4 text-red-500" />;
    if (direction === 'inbound') return <PhoneIncoming className="size-4 text-green-500" />;
    return <PhoneOutgoing className="size-4 text-blue-500" />;
}

export default function EditContact({ contact, accounts, callLogs }: Props) {
    const { errors: pageErrors } = usePage<SharedData & { errors: Partial<Record<string, string>> }>().props;
    const [dialing, setDialing] = useState(false);
    const [expandedLog, setExpandedLog] = useState<number | null>(null);
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

            <div className="max-w-3xl space-y-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Edit contact</h1>
                    <p className="text-muted-foreground text-sm">Keep this relationship current.</p>
                    {contact.phone && (
                        <Button type="button" variant="outline" className="mt-4" disabled={dialpadActionsDisabled || dialing} onClick={dial}>
                            {dialing && <LoaderCircle className="size-4 animate-spin" />}
                            <Phone className="size-4" />
                            {dialing ? 'Dialing...' : 'Dial with Dialpad'}
                        </Button>
                    )}
                </div>

                <FlashAlert />
                {pageErrors.dialpad && (
                    <Alert variant="destructive">
                        <AlertTitle>Dialpad call failed</AlertTitle>
                        <AlertDescription>{pageErrors.dialpad}</AlertDescription>
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

                {/* Call history */}
                <section className="bg-card rounded-lg border shadow-xs">
                    <div className="border-b p-4">
                        <h2 className="font-semibold">Call history</h2>
                        <p className="text-muted-foreground text-xs">{callLogs.length === 0 ? 'No calls logged yet.' : `${callLogs.length} call${callLogs.length === 1 ? '' : 's'} on record`}</p>
                    </div>
                    {callLogs.length === 0 ? (
                        <p className="text-muted-foreground p-4 text-sm">
                            Calls made via Dialpad will appear here automatically.
                        </p>
                    ) : (
                        <div className="divide-y">
                            {callLogs.map((log) => (
                                <div key={log.id} className="p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <CallStatusIcon direction={log.direction} status={log.status} />
                                            <div>
                                                <p className="text-sm font-medium capitalize">
                                                    {log.direction} · {log.status}
                                                </p>
                                                <p className="text-muted-foreground text-xs">{formatDate(log.started_at)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-muted-foreground text-sm">{formatDuration(log.duration_seconds)}</span>
                                            {(log.recording_url || log.transcript_text) && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                                                >
                                                    {expandedLog === log.id ? 'Hide' : 'Details'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    {expandedLog === log.id && (
                                        <div className="mt-3 space-y-2">
                                            {log.recording_url && (
                                                <a
                                                    href={log.recording_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-primary text-sm underline"
                                                >
                                                    Listen to recording
                                                </a>
                                            )}
                                            {log.transcript_text && (
                                                <div className="bg-muted rounded-md p-3">
                                                    <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">Transcript</p>
                                                    <p className="text-sm whitespace-pre-wrap">{log.transcript_text}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>
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
