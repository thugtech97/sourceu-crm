import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { Building2, Handshake, Kanban, LayoutGrid, PhoneIncoming, Users } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        url: '/crm',
        icon: LayoutGrid,
    },
    {
        title: 'Lead Pool',
        url: '/leads/pool',
        icon: PhoneIncoming,
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
        title: 'Deals',
        url: '/deals',
        icon: Handshake,
    },
    {
        title: 'Pipeline',
        url: '/deals/kanban',
        icon: Kanban,
    },
];

export function AppSidebar() {
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
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
