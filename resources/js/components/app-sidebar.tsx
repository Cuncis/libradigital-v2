import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    CreditCard,
    FileText,
    FolderGit2,
    LayoutGrid,
    Newspaper,
    Shield,
    Sparkles,
    Users,
    Wand2,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
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
import admin from '@/routes/admin';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const isAdmin = usePage().props.auth.user.is_admin === true;
    const dashboardUrl = dashboard.url();

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboardUrl,
            icon: LayoutGrid,
        },
    ];

    const adminNavItems: NavItem[] = [
        {
            title: 'Ringkasan',
            href: admin.dashboard().url,
            icon: Shield,
        },
        {
            title: 'Pengguna',
            href: admin.users.index().url,
            icon: Users,
        },
        {
            title: 'Undangan',
            href: admin.invitations.index().url,
            icon: FileText,
        },
        {
            title: 'Pesanan',
            href: admin.orders.index().url,
            icon: CreditCard,
        },
        {
            title: 'Blog',
            href: admin.blog.index().url,
            icon: Newspaper,
        },
        {
            title: 'Animasi',
            href: admin.animations.index().url,
            icon: Sparkles,
        },
        {
            title: 'Animation Packs',
            href: admin.animationPacks.index().url,
            icon: Wand2,
        },
    ];

    const footerNavItems: NavItem[] = [
        {
            title: 'Repository',
            href: 'https://github.com/laravel/react-starter-kit',
            icon: FolderGit2,
        },
        {
            title: 'Documentation',
            href: 'https://laravel.com/docs/starter-kits#react',
            icon: BookOpen,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardUrl} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                {isAdmin && <NavMain items={adminNavItems} label="Admin" />}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
