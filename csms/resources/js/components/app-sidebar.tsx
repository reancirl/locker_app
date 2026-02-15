import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Monitor, Clock3, Boxes, ShoppingCart, CircleDollarSign } from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'PCs',
        href: '/pcs',
        icon: Monitor,
    },
    {
        title: 'Sessions',
        href: '/sessions',
        icon: Clock3,
    },
    {
        title: 'Products',
        href: '/products',
        icon: Boxes,
    },
    {
        title: 'POS',
        href: '/pos',
        icon: ShoppingCart,
        target: '_blank',
        rel: 'noopener',
    },
    {
        title: 'Money',
        href: '/money',
        icon: CircleDollarSign,
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { authRole, authEmail } = usePage().props as { authRole?: string | null; authEmail?: string | null };
    const isCashier =
        authRole === 'cashier' || (authEmail && authEmail.toLowerCase() === 'cashier@bethelhub.com');

    const filteredNavItems = isCashier
        ? mainNavItems.filter((item) => ['/pcs', '/sessions', '/pos'].includes(String(item.href)))
        : mainNavItems;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={filteredNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
