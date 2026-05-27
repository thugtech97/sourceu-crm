import TextLink from '@/components/text-link';
import AuthLayout from '@/layouts/auth-layout';
import { Head } from '@inertiajs/react';
import { ClockIcon, MailCheckIcon } from 'lucide-react';

export default function PendingApproval() {
    return (
        <AuthLayout
            title="Account pending approval"
            description="Your email has been verified. An admin will review and activate your account shortly."
        >
            <Head title="Pending Approval" />

            <div className="flex flex-col items-center gap-6 text-center">
                <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
                    <ClockIcon className="text-muted-foreground h-8 w-8" />
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-medium">What happens next?</p>
                    <ul className="text-muted-foreground space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                            <MailCheckIcon className="text-primary h-4 w-4 shrink-0" />
                            An admin will review your registration
                        </li>
                        <li className="flex items-center gap-2">
                            <MailCheckIcon className="text-primary h-4 w-4 shrink-0" />
                            You'll receive an email once approved
                        </li>
                        <li className="flex items-center gap-2">
                            <MailCheckIcon className="text-primary h-4 w-4 shrink-0" />
                            Then you'll have full access to the CRM
                        </li>
                    </ul>
                </div>

                <TextLink href={route('logout')} method="post" className="text-sm">
                    Log out
                </TextLink>
            </div>
        </AuthLayout>
    );
}
