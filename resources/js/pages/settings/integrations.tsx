import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Integrations',
        href: '/settings/integrations',
    },
];

type DialpadForm = {
    email: string;
};

const dialpadLogoUrl = 'https://us-east.dx.dialpad.com/kpd-static/providers/1565530/webchat/1eed116a4ebc4c7697f62ef6071bc462/images/fab-icon.png';

export default function Integrations() {
    const { auth, flash, errors: pageErrors } = usePage<SharedData & { errors: Partial<Record<string, string>> }>().props;
    const { data, setData, post, processing, errors } = useForm<DialpadForm>({
        email: auth.user.email,
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        post('/dialpad/connect', { preserveScroll: true });
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
                    {flash.status && (
                        <Alert>
                            <AlertTitle>Dialpad</AlertTitle>
                            <AlertDescription>{flash.status}</AlertDescription>
                        </Alert>
                    )}

                    <div className="rounded-lg border p-4">
                        <div className="mb-4 text-sm">
                            <div className="font-medium">{auth.user.dialpad_connected ? 'Connected' : 'Not connected'}</div>
                            {auth.user.dialpad_number && <div className="text-muted-foreground">Number: {String(auth.user.dialpad_number)}</div>}
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="dialpad_email">Dialpad email</Label>
                                <Input id="dialpad_email" type="email" value={data.email} onChange={(event) => setData('email', event.target.value)} />
                                <InputError message={errors.email} />
                            </div>

                            <Button disabled={processing}>
                                {processing && <LoaderCircle className="size-4 animate-spin" />}
                                {processing ? 'Connecting...' : 'Connect Dialpad'}
                            </Button>
                        </form>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
