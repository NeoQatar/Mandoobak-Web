
'use client';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  BarChart,
  ClipboardList,
  FileText,
  Boxes,
  Database,
  List,
  Package,
  Presentation,
  Heart,
  Users,
  Store,
  Building,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';

const translations = {
  en: {
    title: 'Mandobak',
    analytics: 'Analytics',
    dashboard: 'Dashboard',
    users: 'Users',
    usersList: 'Users List',
    orders: 'Orders',
    ordersMenu: 'Orders',
    vendors: 'Vendors',
    invoices: 'Invoices',
    services: 'Services',
    categories: 'Categories',
    subCategories: 'Sub Categories',
    servicesList: 'Services List',
    settings: 'Settings',
    packages: 'Packages',
    sliders: 'Sliders',
    sponsors: 'Sponsors',
    formBuilder: 'Form Builder',
  },
  ar: {
    title: 'مندوبك',
    analytics: 'تحليلات',
    dashboard: 'لوحة التحكم',
    users: 'المستخدمين',
    usersList: 'قائمة المستخدمين',
    orders: 'الطلبات',
    ordersMenu: 'الطلبات',
    vendors: 'البائعون',
    invoices: 'الفواتير',
    services: 'خدمات',
    categories: 'فئات',
    subCategories: 'الفئات الفرعية',
    servicesList: 'قائمة الخدمات',
    settings: 'إعدادات',
    packages: 'الباقات',
    sliders: 'المنزلقات',
    sponsors: 'الرعاة',
    formBuilder: 'منشئ النماذج',
  },
};

export default function AppSidebar() {
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { language } = useLanguage();
  const { dbUser } = useAuth();
  const t = translations[language];
  const isAdmin = dbUser?.type === 'admin';

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <>
      <SidebarHeader className="flex items-center justify-center h-14 border-b">
        {state === 'expanded' && (
          <h2 className="text-2xl font-jiwez text-center">{t.title}</h2>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t.analytics}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/dashboard')}
                tooltip={t.dashboard}
              >
                <Link href="/dashboard" onClick={handleLinkClick}>
                  <BarChart />
                  <span>{t.dashboard}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        {isAdmin && (
        <SidebarGroup>
          <SidebarGroupLabel>{t.users}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/users-list')}
                tooltip={t.usersList}
              >
                <Link href="/users-list" onClick={handleLinkClick}>
                  <Users />
                  <span>{t.usersList}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        )}
        <SidebarGroup>
          <SidebarGroupLabel>{t.orders}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/orders')}
                tooltip={t.ordersMenu}
              >
                <Link href="/orders" onClick={handleLinkClick}>
                  <ClipboardList />
                  <span>{t.ordersMenu}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {isAdmin && (
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={t.vendors}
                isActive={pathname.startsWith('/vendors')}
              >
                <Link href="/vendors" onClick={handleLinkClick}>
                  <Store />
                  <span>{t.vendors}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={t.invoices}
                isActive={pathname.startsWith('/invoices')}
              >
                <Link href="/invoices" onClick={handleLinkClick}>
                  <FileText />
                  <span>{t.invoices}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={t.formBuilder}
                isActive={pathname.startsWith('/apps/formbuilder')}
              >
                <Link href="/apps/formbuilder" onClick={handleLinkClick}>
                  <Building />
                  <span>{t.formBuilder}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            )}
          </SidebarMenu>
          
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{t.services}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={t.categories}
                isActive={pathname.startsWith('/categories')}
              >
                <Link href="/categories" onClick={handleLinkClick}>
                  <Boxes />
                  <span>{t.categories}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={t.subCategories}
                isActive={pathname.startsWith('/sub-categories')}
              >
                <Link href="/sub-categories" onClick={handleLinkClick}>
                  <Database />
                  <span>{t.subCategories}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={t.servicesList}
                isActive={pathname.startsWith('/services-list')}
              >
                <Link href="/services-list" onClick={handleLinkClick}>
                  <List />
                  <span>{t.servicesList}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{t.settings}</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={t.packages}
                isActive={pathname.startsWith('/packages')}
              >
                <Link href="/packages" onClick={handleLinkClick}>
                  <Package />
                  <span>{t.packages}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={t.sliders}
                isActive={pathname.startsWith('/sliders')}
              >
                <Link href="/sliders" onClick={handleLinkClick}>
                  <Presentation />
                  <span>{t.sliders}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={t.sponsors}
                isActive={pathname.startsWith('/sponsors')}
              >
                <Link href="/sponsors" onClick={handleLinkClick}>
                  <Heart />
                  <span>{t.sponsors}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </>
  );
}
