import FlashAlert from '@/components/flash-alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Admin', href: '/admin/users' }, { title: 'User Approvals', href: '/admin/users' }];

type User = {
    id: number;
    name: string;
    email: string;
    is_admin?: boolean;
    created_at: string;
    email_verified_at: string | null;
};

type Props = {
    pendingUsers: User[];
    allUsers: User[];
};

export default function AdminUsers({ pendingUsers, allUsers }: Props) {
    const approve = (user: User) => {
        router.patch(route('admin.users.approve', user.id), {}, { preserveScroll: true });
    };

    const remove = (user: User) => {
        if (confirm(`Remove ${user.name}? This cannot be undone.`)) {
            router.delete(route('admin.users.destroy', user.id), { preserveScroll: true });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Approvals" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <FlashAlert />

                {/* Pending approvals */}
                <div className="rounded-xl border">
                    <div className="border-b px-6 py-4">
                        <h2 className="font-semibold">Pending Approvals</h2>
                        <p className="text-muted-foreground text-sm">Users who have verified their email and are waiting for access.</p>
                    </div>

                    {pendingUsers.length === 0 ? (
                        <div className="text-muted-foreground px-6 py-10 text-center text-sm">No pending approvals.</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
                                <tr>
                                    <th className="px-6 py-3 text-left font-medium">Name</th>
                                    <th className="px-6 py-3 text-left font-medium">Email</th>
                                    <th className="px-6 py-3 text-left font-medium">Registered</th>
                                    <th className="px-6 py-3 text-left font-medium">Verified</th>
                                    <th className="px-6 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {pendingUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-muted/30">
                                        <td className="px-6 py-3 font-medium">{user.name}</td>
                                        <td className="text-muted-foreground px-6 py-3">{user.email}</td>
                                        <td className="text-muted-foreground px-6 py-3">{formatDate(user.created_at)}</td>
                                        <td className="text-muted-foreground px-6 py-3">{formatDate(user.email_verified_at)}</td>
                                        <td className="px-6 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="sm" onClick={() => approve(user)}>
                                                    Approve
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => remove(user)}>
                                                    Remove
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* All approved users */}
                <div className="rounded-xl border">
                    <div className="border-b px-6 py-4">
                        <h2 className="font-semibold">Approved Users</h2>
                        <p className="text-muted-foreground text-sm">All users with active access.</p>
                    </div>

                    {allUsers.length === 0 ? (
                        <div className="text-muted-foreground px-6 py-10 text-center text-sm">No approved users yet.</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
                                <tr>
                                    <th className="px-6 py-3 text-left font-medium">Name</th>
                                    <th className="px-6 py-3 text-left font-medium">Email</th>
                                    <th className="px-6 py-3 text-left font-medium">Role</th>
                                    <th className="px-6 py-3 text-left font-medium">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {allUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-muted/30">
                                        <td className="px-6 py-3 font-medium">{user.name}</td>
                                        <td className="text-muted-foreground px-6 py-3">{user.email}</td>
                                        <td className="px-6 py-3">
                                            {user.is_admin ? (
                                                <Badge variant="secondary">Admin</Badge>
                                            ) : (
                                                <Badge variant="outline">User</Badge>
                                            )}
                                        </td>
                                        <td className="text-muted-foreground px-6 py-3">{formatDate(user.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
