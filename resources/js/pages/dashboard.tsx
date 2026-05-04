import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Building2, Handshake, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">Dashboard</h1>
                    <p className="text-muted-foreground text-sm">Welcome back. Jump into your CRM workspace.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    <Link href="/accounts" className="bg-card hover:bg-muted/50 rounded-lg border p-5 shadow-xs transition">
                        <Building2 className="text-muted-foreground size-5" />
                        <h2 className="mt-4 font-semibold">Accounts</h2>
                        <p className="text-muted-foreground mt-1 text-sm">Organize companies and customer organizations.</p>
                    </Link>
                    <Link href="/contacts" className="bg-card hover:bg-muted/50 rounded-lg border p-5 shadow-xs transition">
                        <Users className="text-muted-foreground size-5" />
                        <h2 className="mt-4 font-semibold">Contacts</h2>
                        <p className="text-muted-foreground mt-1 text-sm">Manage leads, customers, and follow-up details.</p>
                    </Link>
                    <Link href="/deals" className="bg-card hover:bg-muted/50 rounded-lg border p-5 shadow-xs transition">
                        <Handshake className="text-muted-foreground size-5" />
                        <h2 className="mt-4 font-semibold">Deals</h2>
                        <p className="text-muted-foreground mt-1 text-sm">Track opportunities and forecast your pipeline.</p>
                    </Link>
                </div>
                <Button asChild className="w-fit">
                    <Link href="/crm">Open CRM overview</Link>
                </Button>
            </div>
        </AppLayout>
    );
}
