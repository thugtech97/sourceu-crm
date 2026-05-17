import FlashAlert from '@/components/flash-alert';
import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle, SearchCheck } from 'lucide-react';
import { FormEvent, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Integrations',
        href: '/settings/integrations',
    },
];

type DialpadForm = {
    email: string;
};

type DialpadTestResult = {
    email?: string;
    endpoint?: string;
    status?: number;
    successful?: boolean;
    item_count?: number;
    matched?: boolean;
    matched_user?: Record<string, unknown> | null;
    items?: Record<string, unknown>[];
    message?: string | null;
};

const dialpadLogoUrl = 'https://us-east.dx.dialpad.com/kpd-static/providers/1565530/webchat/1eed116a4ebc4c7697f62ef6071bc462/images/fab-icon.png';
const dialpadActionsDisabled = true;

export default function Integrations() {
    const { auth, flash, errors: pageErrors } = usePage<
        SharedData & {
            errors: Partial<Record<string, string>>;
            flash: SharedData['flash'] & { dialpad_test?: DialpadTestResult | null };
        }
    >().props;
    const { data, setData, post, processing, errors } = useForm<DialpadForm>({
        email: auth.user.email,
    });
    const [testing, setTesting] = useState(false);

    function submit(event: FormEvent) {
        event.preventDefault();
        post('/dialpad/connect', { preserveScroll: true });
    }

    function testLookup() {
        router.post(
            '/dialpad/test-lookup',
            { email: data.email },
            {
                preserveScroll: true,
                onStart: () => setTesting(true),
                onFinish: () => setTesting(false),
            },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Integrations" />

            <SettingsLayout>
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <img src={dialpadLogoUrl} alt="" className="size-10 rounded-md" />
                        <div>
                            <h2 className="text-lg font-medium">Dialpad</h2>
                            <p className="text-muted-foreground text-sm">Connect your Dialpad user before placing calls from contact records.</p>
                        </div>
                    </div>

                    {(pageErrors.email || pageErrors.dialpad) && (
                        <Alert variant="destructive">
                            <AlertTitle>Dialpad connection failed</AlertTitle>
                            <AlertDescription>{pageErrors.email ?? pageErrors.dialpad}</AlertDescription>
                        </Alert>
                    )}
                    <FlashAlert />

                    <div className="rounded-lg border p-4">
                        <div className="mb-4 text-sm">
                            <div className="font-medium">{auth.user.dialpad_connected ? 'Connected' : 'Not connected'}</div>
                            {Boolean(auth.user.dialpad_number) && <div className="text-muted-foreground">Number: {String(auth.user.dialpad_number)}</div>}
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="dialpad_email">Dialpad email</Label>
                                <Input id="dialpad_email" type="email" value={data.email} onChange={(event) => setData('email', event.target.value)} />
                                <InputError message={errors.email} />
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button disabled={dialpadActionsDisabled || processing}>
                                    {processing && <LoaderCircle className="size-4 animate-spin" />}
                                    {processing ? 'Connecting...' : 'Connect Dialpad'}
                                </Button>
                                <Button type="button" variant="outline" disabled={dialpadActionsDisabled || testing || processing} onClick={testLookup}>
                                    {testing ? <LoaderCircle className="size-4 animate-spin" /> : <SearchCheck className="size-4" />}
                                    {testing ? 'Testing...' : 'Test Lookup'}
                                </Button>
                            </div>
                        </form>

                        {flash.dialpad_test && (
                            <div className="mt-4 space-y-3 rounded-md border bg-muted/30 p-3 text-sm">
                                <div className="font-medium">Dialpad lookup test</div>
                                <dl className="grid gap-2 sm:grid-cols-2">
                                    <div>
                                        <dt className="text-muted-foreground">Email</dt>
                                        <dd className="break-all">{flash.dialpad_test.email}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">HTTP status</dt>
                                        <dd>{flash.dialpad_test.status ?? 'n/a'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">Items returned</dt>
                                        <dd>{flash.dialpad_test.item_count ?? 0}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">Exact match</dt>
                                        <dd>{flash.dialpad_test.matched ? 'Yes' : 'No'}</dd>
                                    </div>
                                </dl>

                                {flash.dialpad_test.message && <div className="text-destructive">{flash.dialpad_test.message}</div>}

                                <pre className="max-h-72 overflow-auto rounded-md bg-background p-3 text-xs whitespace-pre-wrap">
                                    {JSON.stringify(
                                        {
                                            endpoint: flash.dialpad_test.endpoint,
                                            successful: flash.dialpad_test.successful,
                                            matched_user: flash.dialpad_test.matched_user,
                                            items: flash.dialpad_test.items,
                                        },
                                        null,
                                        2,
                                    )}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
