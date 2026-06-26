import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Ban, Building2, ClipboardList, Handshake, Kanban, LayoutGrid, ShieldCheck, UserCheck, Users } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        url: '/crm',
        icon: LayoutGrid,
    },
    {
        title: 'Leads',
        url: '/leads',
        icon: UserCheck,
    },
    {
        title: 'Contacts',
        url: '/contacts',
        icon: Users,
    },
    {
        title: 'Accounts',
        url: '/accounts',
        icon: Building2,
    },
    {
        title: 'Opportunities',
        url: '/deals',
        icon: Handshake,
    },
    {
        title: 'Pipeline',
        url: '/deals/kanban',
        icon: Kanban,
    },
    {
        title: 'DNC List',
        url: '/dnc',
        icon: Ban,
    },
];

export function AppSidebar() {
    const { auth, pending_approvals_count } = usePage<SharedData>().props;

    const adminNavItems: NavItem[] = [
        {
            title: 'User Approvals',
            url: '/admin/users',
            icon: ShieldCheck,
            badge: pending_approvals_count > 0 ? pending_approvals_count : null,
        },
        {
            title: 'Audit Log',
            url: '/admin/audit-log',
            icon: ClipboardList,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                {auth.user.is_admin && <NavMain items={adminNavItems} label="Admin" />}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
